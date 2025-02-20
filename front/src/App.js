import React, {useState} from "react";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
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
        setPredictionResult(data);
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

          {/* 예측 버튼 */}
          <button className="upload-btn" onClick={handleSubmit}
                  disabled={loading}>
            {loading ? "처리 중..." : "이미지 업로드 & 예측"}
          </button>

          {/* 예측 결과 출력 */}
          {predictionResult && (
              <div className="result-container">
                <p>🍽 음식: <strong>{predictionResult.food_name}</strong></p>
                <p>🔍 정확도: <strong>{predictionResult.confidence}%</strong></p>
                <p>🍏 칼로리: <strong>{predictionResult.calories}</strong> kcal</p>

                {/* 운동 추천 출력 */}
                <div className="exercise-list">
                  {predictionResult.exercise && predictionResult.exercise.length
                  > 0 ? (
                      <>
                        <h3>추천 운동</h3>
                        <ul>
                          {predictionResult.exercise.map((exercise, index) => (
                              <li key={index}>
                                <strong>{exercise.운동이름}</strong> {exercise['운동시간(분)'].toFixed(
                                  1)} 분
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
      </div>
  );
}

export default App;
