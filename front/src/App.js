import React, { useState } from "react";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictionResults, setPredictionResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(""); // 기본값을 ""로 설정
  const [imageUrl, setImageUrl] = useState(null);

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

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setPredictionResults(data.predictions);
        setSelectedFood(""); // 버튼 클릭 시 선택값 초기화
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

  return (
    <div className="container">
      <div className="card">
        <h1>
          <strong>eteam</strong> 운동 추천🏃‍♀️‍➡️
        </h1>

        {/* 파일 업로드 버튼 */}
        <div className="file-container">
          <label className="custom-file-upload">
            파일 선택
            <input type="file" onChange={handleFileChange} accept="image/*" className="file-input" />
          </label>
          <p className="file-name">{selectedFile ? `📂 ${selectedFile.name}` : "선택된 파일 없음"}</p>
        </div>

        {/* 선택된 이미지 출력 */}
        {imageUrl && (
          <div className="image-preview">
            <img src={imageUrl} alt="Uploaded" className="preview-image" />
          </div>
        )}

        {/* 예측 버튼 */}
        <button className="upload-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "처리 중..." : "이미지 업로드 & 예측"}
        </button>

        {/* 예측 결과 출력 */}
        {predictionResults.length > 0 && (
          <div className="result-container">
            <h3>🔍 음식 선택</h3>
            <select
              className="custom-dropdown"
              value={selectedFood} // 선택된 값 유지
              onChange={(e) => setSelectedFood(e.target.value)}
            >
              <option value="">음식을 선택하세요</option>
              {predictionResults.map((item, index) => (
                <option key={index} value={item.food_name}>
                  {item.food_name} ({item.confidence}%)
                </option>
              ))}
            </select>

            {/* 사용자가 음식을 선택했을 때 상세 정보 표시 */}
            {selectedFood && (
              <div className="food-details">
                <p>🍽 음식: <strong>{selectedFood}</strong></p>
                <p>🍏 칼로리: <strong>{predictionResults.find(item => item.food_name === selectedFood)?.calories}</strong> kcal</p>

                {/* 운동 추천 출력 */}
                <div className="exercise-list">
                  {predictionResults.find(item => item.food_name === selectedFood)?.exercise?.length > 0 ? (
                    <>
                      <h3>추천 운동</h3>
                      <ul>
                        {predictionResults
                          .find(item => item.food_name === selectedFood)
                          .exercise.map((exercise, index) => (
                            <li key={index}>
                              <strong>{exercise.운동이름}</strong> {exercise["운동시간(분)"].toFixed(1)} 분
                            </li>
                          ))}
                      </ul>
                    </>
                  ) : (
                    <p>운동 추천 정보가 없습니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
