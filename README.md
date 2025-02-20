# Eat-Burn
"Eat &amp; Burn: K-Food Edition" 🔥🍚💪
이 프로젝트는 사용자가 음식 이미지를 업로드하면, 이미지에서 음식 이름을 예측하고, 해당 음식의 칼로리 정보를 기반으로 소모할 수 있는 운동을 추천하는 시스템입니다. 
이 시스템은 Azure Custom Vision을 사용하여 이미지 분석을 수행하고, Flask를 이용한 서버와 React를 사용한 프로젝트입니다.

<img width="359" alt="image" src="https://github.com/user-attachments/assets/dbdc3eba-04f9-4f7c-bd2f-4b418765bfba" />

## 기능

- 음식 이미지 업로드 및 분석: 사용자가 업로드한 음식 이미지를 Azure Custom Vision API로 분석하여 음식 이름을 예측합니다.
- 칼로리 기반 운동 추천: 예측된 음식에 해당하는 칼로리 데이터를 사용하여, 사용자가 소모할 수 있는 운동을 추천합니다.
- 실시간 피드백: 사용자는 이미지를 업로드하고, 실시간으로 예측된 음식과 운동을 확인할 수 있습니다.

## 기술 스택

### 백엔드 (Server)
- **Flask**: Python 기반의 웹 프레임워크, API 서버 구축
- **Azure Custom Vision API**: 이미지 분석을 위한 클라우드 기반 서비스
- **Pandas**: CSV 파일을 처리하고, 칼로리 데이터를 관리하는 라이브러리
- **Torch**: 데이터 분석 및 모델링에 사용된 라이브러리

### 프론트엔드 (Client)
- **React**: JavaScript 라이브러리, UI 구성
- **CSS**: 페이지 스타일링을 위한 스타일시트
- **Fetch API**: 서버와 통신하여 이미지 업로드 및 예측 결과 받기

## 프로젝트 실행 방법

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


