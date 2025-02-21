import os
import requests
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

app = Flask(__name__)
CORS(app)  # 모든 도메인 허용

# 환경 변수 로드
load_dotenv()

# Azure Custom Vision API 정보
PREDICTION_KEY = "6XRfesg0Ka3EwuWvdx1MuMY9gGij25QJP3eoMKC7OGPQOtl9EojMJQQJ99BBACi0881XJ3w3AAAIACOGENeY"
PROJECT_ID = "bacf31b3-a6f7-40fd-8357-23aace5429cd"
ITERATION_NAME = "Iteration2"
ENDPOINT = "https://foodnamepredict-prediction.cognitiveservices.azure.com"
PREDICTION_URL = f"{ENDPOINT}/customvision/v3.0/Prediction/{PROJECT_ID}/classify/iterations/{ITERATION_NAME}/image"

# CSV 파일 경로
FOOD_DATA_PATH = "250220 kfood_rev1.csv"
EXERCISE_DATA_PATH = "250220 exercise.csv"

# Novita AI OpenAI 클라이언트 설정
client = OpenAI(
    base_url="https://api.novita.ai/v3/openai",
    api_key="<Novita API Key>",
)

# 기초대사량(BMR) 계산 함수
def calculate_bmr(gender, age, weight, height):
    if gender == "male":
        return 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age)
    else:
        return 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age)

# LLM 호출 함수
def get_llm_response(food_name):
    try:
        model = "mistralai/mistral-nemo"
        stream = False
        max_tokens = 1000
        system_content = "Be a helpful assistant"
        temperature = 0.5
        top_p = 0.5
        min_p = 0
        top_k = 50
        presence_penalty = 0
        frequency_penalty = 0
        repetition_penalty = 1
        response_format = {"type": "text"}

        # LLM 프롬프트: 음식 이름으로 영양소 정보 요청
        prompt = (
            f"음식 이름: {food_name}. "
            "이 음식의 영양소 정보 및 관련 정보를 한국어로만 간단하게 제공하세요. "
            "단백질(g), 지방(g), 탄소화물(g) 등의 영양소를 포함하고, "
            "대략적인 1인분 기준으로 추정해서 설명해주세요."
            "칼로리 정보는 이미 포함되어 있으니 제외하는데, 이 부분에 대해 얘기하지 마세요."
        )

        chat_completion_res = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt},
            ],
            stream=stream,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            presence_penalty=presence_penalty,
            frequency_penalty=frequency_penalty,
            response_format=response_format,
            extra_body={
                "top_k": top_k,
                "repetition_penalty": repetition_penalty,
                "min_p": min_p
            }
        )

        return chat_completion_res.choices[0].message.content
    except Exception as e:
        return f"LLM 호출 오류: {str(e)}"

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': '이미지 파일을 업로드하세요.'}), 400

    # 사용자 정보 받기
    gender = request.form.get("gender")
    age = float(request.form.get("age"))
    weight = float(request.form.get("weight"))
    height = float(request.form.get("height"))

    image_file = request.files['file']

    # 요청 헤더 설정
    headers = {
        "Prediction-Key": PREDICTION_KEY,
        "Content-Type": "application/octet-stream"
    }

    # API 호출 (Azure Custom Vision)
    response = requests.post(PREDICTION_URL, headers=headers, data=image_file.read())
    result = response.json()

    if "predictions" in result and len(result["predictions"]) > 0:
        top_predictions = sorted(result["predictions"], key=lambda x: x["probability"], reverse=True)[:3]
        predictions_list = []

        try:
            food_data = pd.read_csv(FOOD_DATA_PATH)
            exercise_data = pd.read_csv(EXERCISE_DATA_PATH)
        except Exception as e:
            return jsonify({'error': f"데이터 파일 로드 오류: {e}"}), 500

        # BMR(기초대사량) 계산
        bmr = calculate_bmr(gender, age, weight, height)

        for prediction in top_predictions:
            predicted_tag = prediction["tagName"]
            confidence_score = prediction["probability"] * 100

            matched_row = food_data[food_data['통합_식품명'] == predicted_tag]
            input_calories = matched_row.iloc[0]['1인당Cal'] if not matched_row.empty else "데이터 없음"

            if input_calories != "데이터 없음":
                exercise_data['운동시간(분)'] = (input_calories / exercise_data['칼로리(1분)']) * (weight / 70)
                top_exercises = exercise_data[['운동이름', '운동시간(분)']].sort_values(by='운동시간(분)').head(5).to_dict(orient='records')
            else:
                top_exercises = '운동 데이터 없음'

            predictions_list.append({
                'food_name': predicted_tag,
                'confidence': round(confidence_score, 2),
                'calories': input_calories,
                'bmr': round(bmr, 2),
                'exercise': top_exercises
            })

        # LLM 호출: 가장 확률 높은 음식 이름으로 영양소 정보 요청
        top_food = predictions_list[0]['food_name']
        llm_response = get_llm_response(top_food)

        # 응답에 predictions와 llmResponse 포함
        return jsonify({
            'predictions': predictions_list,
            'llmResponse': llm_response
        })
    else:
        return jsonify({'error': '예측 결과를 찾을 수 없습니다.'}), 500

if __name__ == '__main__':
    app.run(debug=True)