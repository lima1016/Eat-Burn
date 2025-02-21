import os
import requests
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.neighbors import NearestNeighbors
import logging
from dotenv import load_dotenv
from openai import OpenAI

app = Flask(__name__)
CORS(app)

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
)

# Azure Custom Vision API 정보
PREDICTION_KEY = "6XRfesg0Ka3EwuWvdx1MuMY9gGij25QJP3eoMKC7OGPQOtl9EojMJQQJ99BBACi0881XJ3w3AAAIACOGENeY"
PROJECT_ID = "bacf31b3-a6f7-40fd-8357-23aace5429cd"
ITERATION_NAME = "Iteration2"
ENDPOINT = "https://foodnamepredict-prediction.cognitiveservices.azure.com"
PREDICTION_URL = f"{ENDPOINT}/customvision/v3.0/Prediction/{PROJECT_ID}/classify/iterations/{ITERATION_NAME}/image"

# CSV 파일 경로
FOOD_DATA_PATH = "250220 kfood_rev1.csv"
EXERCISE_DATA_PATH = "250220 exercise.csv"
TRACKING_DATA_PATH = "운동_gym_members_exercise_tracking.csv"

# Novita AI OpenAI 클라이언트 설정
client = OpenAI(
    base_url="https://api.novita.ai/v3/openai",
    api_key="<API-KEY>",
)

# 기초대사량(BMR) 계산 함수
def calculate_bmr(gender, age, weight, height):
    if gender == "남성":
        return 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age)
    else:  # "여성"
        return 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age)

# 운동 추천 모델 학습
def train_exercise_recommendation_model(tracking_data):
    tracking_data['Gender_numeric'] = tracking_data['Gender'].map({'남성': 1, '여성': 0}).fillna(0)
    features = tracking_data[['Gender_numeric', 'Age', 'Weight', 'Height']].fillna(0)
    model = NearestNeighbors(n_neighbors=5, algorithm='auto').fit(features)
    return model, features

# 사용자 정보 기반 운동 추천
def recommend_exercises(model, features, user_data, exercise_data, tracking_data, calories_to_burn, weight):
    gender_numeric = 1 if user_data['gender'] == "남성" else 0
    user_features = pd.DataFrame([[gender_numeric, user_data['age'], user_data['weight'], user_data['height']]],
                                 columns=['Gender_numeric', 'Age', 'Weight', 'Height'])
    distances, indices = model.kneighbors(user_features)
    similar_users = tracking_data.iloc[indices[0]]
    recommended = exercise_data[exercise_data['종류'].isin(similar_users['종류'].unique())].copy()
    recommended['운동시간(분)'] = (calories_to_burn / recommended['칼로리(1분)']) * (weight / 70)
    return recommended[['운동이름', '운동시간(분)', '종류']].sort_values(by='운동시간(분)').head(5).to_dict(orient='records')

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

        prompt = (
            f"음식 이름: {food_name}. "
            "이 음식의 영양소 정보 및 관련 정보를 한국어로만 간단하게 제공하세요. "
            "단백질(g), 지방(g), 탄소화물(g) 등의 영양소를 포함하고, "
            "대략적인 1인분 기준으로 추정해서 설명해주세요. "
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
        logging.error("이미지 파일이 업로드되지 않았습니다.")
        return jsonify({'error': '이미지 파일을 업로드하세요.'}), 400

    # 사용자 정보 받기
    gender = request.form.get("gender")
    age = request.form.get("age")
    weight = request.form.get("weight")
    height = request.form.get("height")

    # 입력값 로깅
    logging.info(f"Received gender: {gender}")
    logging.info(f"Received age: {age}")
    logging.info(f"Received weight: {weight}")
    logging.info(f"Received height: {height}")

    # 입력값 변환 및 유효성 검사
    try:
        age = float(age) if age is not None else None
        weight = float(weight) if weight is not None else None
        height = float(height) if height is not None else None
    except (ValueError, TypeError) as e:
        logging.error(f"입력값 변환 오류: {str(e)}")
        return jsonify({'error': '나이, 체중, 키는 숫자 형식이어야 합니다.'}), 400

    if gender not in ["남성", "여성"]:
        logging.error(f"잘못된 성별 입력: {gender}")
        return jsonify({'error': '성별은 "남성" 또는 "여성"으로 입력해주세요.'}), 400

    if any(v is None for v in [age, weight, height]):
        logging.error("필수 입력값이 누락됨: age, weight, height 중 하나가 None")
        return jsonify({'error': '나이, 체중, 키는 필수 입력값입니다.'}), 400

    image_file = request.files['file']

    # 요청 헤더 설정
    headers = {
        "Prediction-Key": PREDICTION_KEY,
        "Content-Type": "application/octet-stream"
    }

    # API 호출
    response = requests.post(PREDICTION_URL, headers=headers, data=image_file.read())
    result = response.json()

    if "predictions" not in result or len(result["predictions"]) == 0:
        logging.error("Azure API에서 예측 결과를 찾을 수 없음")
        return jsonify({'error': '예측 결과를 찾을 수 없습니다.'}), 500

    try:
        food_data = pd.read_csv(FOOD_DATA_PATH)
        exercise_data = pd.read_csv(EXERCISE_DATA_PATH)
        tracking_data = pd.read_csv(TRACKING_DATA_PATH)
    except Exception as e:
        logging.error(f"데이터 파일 로드 오류: {e}")
        return jsonify({'error': f"데이터 파일 로드 오류: {e}"}), 500

    # 운동 추천 모델 학습
    model, features = train_exercise_recommendation_model(tracking_data)

    # BMR 계산
    bmr = calculate_bmr(gender, age, weight, height)

    top_predictions = sorted(result["predictions"], key=lambda x: x["probability"], reverse=True)[:3]
    predictions_list = []

    for prediction in top_predictions:
        predicted_tag = prediction["tagName"]
        confidence_score = prediction["probability"] * 100

        matched_row = food_data[food_data['통합_식품명'] == predicted_tag]
        input_calories = matched_row.iloc[0]['1인당Cal'] if not matched_row.empty else "데이터 없음"

        if input_calories != "데이터 없음":
            user_data = {'gender': gender, 'age': age, 'weight': weight, 'height': height}
            recommended_exercises = recommend_exercises(model, features, user_data, exercise_data, tracking_data, input_calories, weight)
        else:
            recommended_exercises = '운동 데이터 없음'

        # 각 음식에 대해 LLM 응답 호출
        llm_response = get_llm_response(predicted_tag)

        predictions_list.append({
            'food_name': predicted_tag,
            'confidence': round(confidence_score, 2),
            'calories': input_calories,
            'bmr': round(bmr, 2),
            'exercise': recommended_exercises,
            'llmResponse': llm_response  # 개별 LLM 응답 추가
        })

    logging.info("요청 처리 완료")
    return jsonify({'predictions': predictions_list})

if __name__ == '__main__':
    app.run(debug=True)