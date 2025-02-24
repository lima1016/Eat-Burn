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
      <p className="disclaimer">
        본 서비스는 정보 제공 및 일반적인 건강 관리 도구로 제공되며, 정식 의료서비스 또는 전문적인 의료 진단·치료를 제공하지 않습니다. 사용자가 입력한 데이터는 일체 저장되지 않으며, 실시간 처리 후 즉시 삭제됩니다. 본 서비스는 법적·의료적 책임을 지지 않으며, 사용자는 자신의 건강 상태에 대한 최종 판단은 스스로 하셔야 합니다.
      </p>
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