import os
import requests
import json
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS  # CORS 추가

app = Flask(__name__)
CORS(app)  # 모든 도메인 허용

# Azure Custom Vision API 정보
PREDICTION_KEY = "6XRfesg0Ka3EwuWvdx1MuMY9gGij25QJP3eoMKC7OGPQOtl9EojMJQQJ99BBACi0881XJ3w3AAAIACOGENeY"
PROJECT_ID = "bacf31b3-a6f7-40fd-8357-23aace5429cd"
ITERATION_NAME = "Iteration2"
ENDPOINT = "https://foodnamepredict-prediction.cognitiveservices.azure.com"
PREDICTION_URL = f"{ENDPOINT}/customvision/v3.0/Prediction/{PROJECT_ID}/classify/iterations/{ITERATION_NAME}/image"

# CSV 파일 경로 설정
FOOD_DATA_PATH = "250218 한국음식 데이터 합본.csv"
EXERCISE_DATA_PATH = "운동데이터_송부.csv"


@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': '이미지 파일을 업로드하세요.'}), 400

    image_file = request.files['file']

    # 요청 헤더 설정
    headers = {
        "Prediction-Key": PREDICTION_KEY,
        "Content-Type": "application/octet-stream"
    }

    # API 호출
    response = requests.post(PREDICTION_URL, headers=headers, data=image_file.read())
    result = response.json()

    # 예측 결과 확인
    if "predictions" in result and len(result["predictions"]) > 0:
        best_prediction = max(result["predictions"], key=lambda x: x["probability"])
        predicted_tag = best_prediction["tagName"]
        confidence_score = best_prediction["probability"] * 100

        # 음식의 칼로리 정보 찾기
        try:
            food_data = pd.read_csv(FOOD_DATA_PATH)
        except Exception as e:
            return jsonify({'error': f"음식 데이터 파일 로드 오류: {e}"}), 500

        matched_row = food_data[food_data['통합_식품명'] == predicted_tag]
        if not matched_row.empty:
            input_calories = matched_row.iloc[0]['1인당Cal']  # 칼로리 값 가져오기
        else:
            input_calories = "데이터 없음"

        # 운동 데이터 로드
        try:
            exercise_data = pd.read_csv(EXERCISE_DATA_PATH)
        except Exception as e:
            return jsonify({'error': f"운동 데이터 파일 로드 오류: {e}"}), 500

        # 운동 데이터에서 상위 5개 운동 추천
        if input_calories == "데이터 없음":
            return jsonify({
                'food_name': predicted_tag,
                'confidence': round(confidence_score, 2),
                'calories': input_calories,
                'exercise': '운동 데이터 없음'
            })
        else:
            exercise_data = exercise_data[['운동이름', '칼로리(1분)', '종류']]
            exercise_data['운동시간(분)'] = input_calories / exercise_data['칼로리(1분)']
            top_exercises = exercise_data[['운동이름', '운동시간(분)']].sort_values(by='운동시간(분)').head(5)

            return jsonify({
                'food_name': predicted_tag,
                'confidence': round(confidence_score, 2),
                'calories': input_calories,
                'exercise': top_exercises.to_dict(orient='records')
            })
    else:
        return jsonify({'error': '예측 결과를 찾을 수 없습니다.'}), 500


if __name__ == '__main__':
    app.run(debug=True)
