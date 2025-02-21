# Eat &amp; Burn: K-Food Edition 🔥🍚💪

운동과 식단 관리를 한 번에! 이미지 업로드로 음식 분석과 맞춤 운동 추천을 받아보세요.

<img width="1591" alt="image" src="https://github.com/user-attachments/assets/e4f0f4b4-ec21-4233-83ce-1238a482a9df" />


## 📋 프로젝트 개요
운동 추천은 사용자가 업로드한 음식 사진을 분석하여 음식의 영양 정보를 제공하고, 사용자의 신체 정보(성별, 나이, 체중, 키)를 기반으로 기초대사량(BMR)을 계산한 뒤, 섭취 칼로리를 소모할 수 있는 맞춤 운동을 추천하는 웹 애플리케이션입니다. Azure Custom Vision API로 음식을 인식하고, LLM을 활용해 추가적인 영양 정보를 제공하며, k-최근접 이웃(KNN) 알고리즘으로 사용자 맞춤 운동을 제안합니다.

## ✨ 주요 기능
- 음식 인식: Azure Custom Vision API를 활용해 업로드된 이미지에서 음식을 예측하고, 상위 3개의 결과를 제공합니다.
- 칼로리 및 영양 정보: 예측된 음식의 칼로리와 LLM(예: Mistral Nemo)을 통해 단백질, 지방, 탄수화물 등 영양소 정보를 제공합니다.
- 기초대사량 계산: 사용자의 성별, 나이, 체중, 키를 입력받아 BMR을 계산합니다.
- 운동 추천: KNN 기반 추천 시스템으로, 섭취 칼로리를 소모할 수 있는 운동과 필요한 운동 시간을 제안합니다.
- 직관적인 UI: React 기반 프론트엔드로 이미지 업로드, 결과 선택, LLM 응답 확인이 가능합니다.

## 🛠️ 기술 스택
### 백엔드
- 언어: Python
- 프레임워크: Flask
-AI/ML:
  - Azure Custom Vision API (음식 이미지 분류)
  - Scikit-learn (KNN 기반 운동 추천)
- LLM: Novita AI OpenAI 클라이언트 (Mistral Nemo 모델)
- 데이터: CSV 파일 (음식 데이터, 운동 데이터, 사용자 추적 데이터)
### 프론트엔드
- 언어: JavaScript
- 프레임워크: React
- 스타일링: CSS
- 기타: Flask-CORS (크로스 오리진 요청 처리)

## 📚 데이터셋
- 250220 kfood_rev1.csv: 음식 이름과 1인분 칼로리 데이터
- 250220 exercise.csv: 운동 이름, 종류, 1분당 칼로리 소모량
- 운동_gym_members_exercise_tracking.csv: 사용자 운동 추적 데이터 (성별, 나이, 체중, 키 등)


## 프로젝트 실행 방법
- 언어: JavaScript
- 프레임워크: React
- 스타일링: CSS
- 기타: Flask-CORS (크로스 오리진 요청 처리)

### 1. 서버 실행 (백엔드)
서버는 Flask로 구현되어 있으며, Python 환경에서 실행됩니다.

1. 먼저 필요한 패키지를 설치합니다:

    ```bash
    pip install -r requirements.txt
    ```

2. Flask 서버를 실행합니다:

    ```bash
    python Exercise.py
    ```

    서버가 실행되면, `http://localhost:5000`에서 API가 동작합니다.

### 2. 클라이언트 실행 (프론트엔드)
프론트엔드는 React로 구현되어 있으며, 아래의 명령어로 로컬 서버에서 실행할 수 있습니다.

1. 프로젝트 디렉토리에서 필요한 패키지를 설치합니다:

    ```bash
    npm install
    ```

2. React 애플리케이션을 실행합니다:

    ```bash
    npm start
    ```

    웹 애플리케이션은 `http://localhost:3000`에서 접근할 수 있습니다.

### 3. 이미지 업로드 및 예측
- 웹 애플리케이션에서 이미지를 업로드하면, Flask 서버가 이를 받아서 Azure Custom Vision API를 통해 예측하고, 예측 결과를 반환합니다.
- 반환된 예측 음식 이름을 바탕으로 칼로리 데이터를 조회하고, 소모할 수 있는 운동을 추천합니다.


