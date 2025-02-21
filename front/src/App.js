import React, { useState } from "react";
import UserInputForm from "./UserInputForm";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictionResults, setPredictionResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [userData, setUserData] = useState(null);

  const handleUserDataSubmit = (data) => {
    setUserData(data);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("이미지를 선택하세요!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("age", userData.age);
    formData.append("gender", userData.gender);
    formData.append("weight", userData.weight);
    formData.append("height", userData.height);

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setPredictionResults(data.predictions);
        setSelectedFood(""); // 음식 선택 초기화
      } else {
        alert(data.error || "예측 요청 실패");
      }
    } catch (error) {
      console.error(error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // LLM 응답에서 "g"가 포함된 마지막 위치를 기준으로 영양소 정보와 추가 정보를 분리하는 함수
  const splitLLMResponse = (llmResponse) => {
    if (!llmResponse) return { nutrients: "", additional: "" };

    let nutrients = "";
    let additional = "";

    // 텍스트에서 "g"가 포함된 마지막 위치 찾기
    const lastGIndex = llmResponse.lastIndexOf("g");
    if (lastGIndex !== -1) {
      // "g" 뒤의 텍스트를 추가 정보로, 앞의 텍스트를 영양소 정보로 분리
      nutrients = llmResponse.substring(0, lastGIndex + 1).trim(); // "g"까지 포함
      additional = llmResponse.substring(lastGIndex + 1).trim(); // "g" 뒤의 텍스트
    } else {
      // "g"가 없는 경우, 전체를 영양소 정보로 간주
      nutrients = llmResponse;
    }

    return { nutrients, additional };
  };

  // 영양소 정보를 파싱하여 리스트로 변환
  const parseNutrients = (nutrientsText) => {
    if (!nutrientsText) return [];

    // 영양소 텍스트에서 단백질, 지방, 탄수화물 추출
    const nutrientLines = nutrientsText.split("\n").filter(line => line.includes(":"));
    return nutrientLines.map(line => {
      const [name, value] = line.split(": ").map(part => part.trim());
      return { name, value };
    });
  };

  return (
    <div className="container">
      {!userData ? (
        <UserInputForm onSubmit={handleUserDataSubmit} />
      ) : (
        <div className="app-wrapper">
          {/* 왼쪽 열: 메인 콘텐츠 */}
          <div className="main-content">
            <div className="card">
              <h1>
                <strong>eteam</strong> 운동 추천🏃‍♀️‍➡️
              </h1>
              <div className="file-container">
                <label className="custom-file-upload">
                  파일 선택
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="file-input"
                  />
                </label>
                <p className="file-name">
                  {selectedFile ? `📂 ${selectedFile.name}` : "선택된 파일 없음"}
                </p>
              </div>

              {imageUrl && (
                <div className="image-preview">
                  <img src={imageUrl} alt="Uploaded" className="preview-image" />
                </div>
              )}

              <button
                className="upload-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "처리 중..." : "이미지 업로드 & 예측"}
              </button>

              {predictionResults.length > 0 && (
                <div className="result-container">
                  <h3>🔍 음식 선택</h3>
                  <select
                    className="custom-dropdown"
                    value={selectedFood}
                    onChange={(e) => setSelectedFood(e.target.value)}
                  >
                    <option value="">음식을 선택하세요</option>
                    {predictionResults.map((item, index) => (
                      <option key={index} value={item.food_name}>
                        {item.food_name} ({item.confidence}%)
                      </option>
                    ))}
                  </select>

                  {selectedFood && (
                    <div className="food-details">
                      <p>
                        🍽 음식: <strong>{selectedFood}</strong>
                      </p>
                      <p>
                        🍏 칼로리:{" "}
                        <strong>
                          {
                            predictionResults.find(
                              (item) => item.food_name === selectedFood
                            )?.calories
                          }
                        </strong>{" "}
                        kcal
                      </p>
                      <p>
                        🔥 기초대사량 (BMR):{" "}
                        <strong>
                          {
                            predictionResults.find(
                              (item) => item.food_name === selectedFood
                            )?.bmr
                          }
                        </strong>{" "}
                        kcal
                      </p>

                      <div className="exercise-list">
                        <h3>💪 사용자 맞춤 운동 추천</h3>
                        <ul>
                          {predictionResults
                            .find((item) => item.food_name === selectedFood)
                            ?.exercise.map((exercise, index) => (
                              <li key={index}>
                                <strong>{exercise.운동이름}</strong>{" "}
                                {exercise["운동시간(분)"].toFixed(1)} 분
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 열: 사용자 정보와 LLM 출력 (음식 선택 시만 표시) */}
          {selectedFood && (
            <div className="info-section">
              {/* 사용자 정보 패널 */}
              <div className="user-panel">
                <h3>👤 사용자 정보</h3>
                <div className="user-info">
                  <p><strong>성별:</strong> {userData.gender}</p>
                  <p><strong>나이:</strong> {userData.age}세</p>
                  <p><strong>체중:</strong> {userData.weight}kg</p>
                  <p><strong>키:</strong> {userData.height}cm</p>
                  <p><strong>BMR:</strong> {predictionResults.find(item => item.food_name === selectedFood)?.bmr || "N/A"} kcal</p>
                </div>
              </div>

              {/* LLM 출력 패널 */}
              <div className="llm-panel">
                <h3>🤖 LLM 응답</h3>
                <div className="llm-response">
                  {/* 영양소 정보 (리스트로 표시) */}
                  <div className="llm-nutrients">
                    <h4>🍴 영양소 정보</h4>
                    <div className="nutrient-table">
                      {parseNutrients(
                        splitLLMResponse(
                          predictionResults.find((item) => item.food_name === selectedFood)?.llmResponse
                        )?.nutrients
                      ).map((nutrient, index) => (
                        <div key={index} className="nutrient-row">
                          <span className="nutrient-name">{nutrient.name}</span>
                          <span className="nutrient-value">{nutrient.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 추가 정보 */}
                  <div className="llm-additional">
                    <h4>📋 추가 정보</h4>
                    <p>
                      {splitLLMResponse(
                        predictionResults.find((item) => item.food_name === selectedFood)?.llmResponse
                      )?.additional || "추가 정보 없음"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;