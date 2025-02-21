import React, { useState } from "react";
import "./UserInputForm.css"; // CSS 파일 가져오기

const UserInputForm = ({ onSubmit }) => {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState(""); // 몸무게 (kg)
  const [height, setHeight] = useState(""); // 키 (cm)

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!age || !gender || !weight || !height) {
      alert("모든 정보를 입력해주세요!");
      return;
    }
    onSubmit({ age, gender, weight, height });
  };

  return (
    <div className="user-form-container">
      <h2>사용자 정보 입력</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>나이</label>
          <input
            type="number"
            placeholder="나이를 입력하세요"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>성별</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">선택하세요</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
          </select>
        </div>

        <div className="input-group">
          <label>몸무게 (kg)</label>
          <input
            type="number"
            placeholder="몸무게를 입력하세요"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>키 (cm)</label>
          <input
            type="number"
            placeholder="키를 입력하세요"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-btn">정보 제출</button>
      </form>
    </div>
  );
};

export default UserInputForm;
