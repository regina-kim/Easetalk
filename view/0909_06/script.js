document.addEventListener("DOMContentLoaded", () => {
  fetchDataDirectory()
    .then(fileNames => renderFileList(fileNames))
    .catch(err => {
      const filesUl = document.getElementById("files");
      filesUl.innerHTML = `<li style="color:#e74c3c;">폴더 내용을 불러오는 데 실패했습니다: ${err.message}</li>`;
    });
});

async function fetchDataDirectory() {
  const response = await fetch("index.json");
  if (!response.ok) {
    throw new Error("index.json 파일을 불러오는 데 실패했습니다.");
  }
  const fileNames = await response.json(); // 문자열 배열로 반환됨
  return fileNames;
}

// (B) 파일 목록을 왼쪽에 렌더링
function renderFileList(fileNames) {
  const filesUl = document.getElementById("files");
  filesUl.innerHTML = "";
  if (fileNames.length === 0) {
    filesUl.innerHTML = `<li>데이터 폴더에 .json 파일이 없습니다.</li>`;
    return;
  }
  fileNames.sort();
  fileNames.forEach(filename => {
    const li = document.createElement("li");
    li.textContent = filename;
    li.addEventListener("click", () => loadAndRenderChat(filename));
    filesUl.appendChild(li);
  });
}

// (C) JSON 데이터를 불러와서 헤더 테이블과 채팅 메시지를 렌더링
async function loadAndRenderChat(filename) {
  // 1) 파일명 표시
  document.getElementById("filename-display").textContent = filename;

  // 2) 채팅 메시지 영역 초기화(헤더 행만 남김)
  const chatMessagesDiv = document.getElementById("chat-messages");
  chatMessagesDiv.innerHTML = `
    <div class="row header-row">
      <div class="cell header-label">Therapist</div>
      <div class="cell header-label">Client</div>
      <div class="cell header-label">SC Master</div>
    </div>`;

  // 3) 헤더 테이블 초기화
  const headerTbody = document.querySelector("#header-table tbody");
  headerTbody.innerHTML = "";

  try {
    const response = await fetch(`../../data/0909_06/${filename}`);
    if (!response.ok) throw new Error("파일을 불러오는 데 실패했습니다.");
    const data = await response.json();

    // 4) 헤더 테이블 구성 (Phase별 Therapist count + Category + Concern)
    buildHeaderTable(data);

    if (data.concern) {
          const concernDiv = document.createElement('div');
          concernDiv.className = 'concern-display-area'; // 단계 2에서 추가한 CSS 클래스 적용
          concernDiv.textContent = `Concern: ${data.concern}`;
    
          // chat-messages의 첫 번째 자식(header-row) 뒤에 삽입
          const headerRow = chatMessagesDiv.querySelector('.header-row');
          if (headerRow) {
            headerRow.insertAdjacentElement('afterend', concernDiv);
          } else {
            // 혹시 모를 예외 처리
            chatMessagesDiv.prepend(concernDiv);
          }
        }


    // 5) dialogue_total을 순회하며 채팅 메시지 추가
    if (Array.isArray(data.dialogue_total)) {
      data.dialogue_total.forEach(entry => {
        appendRow(entry);
      });
    } else {
      // 유효하지 않은 데이터인 경우, 중앙 셀에 오류 메시지 표시
      const errDiv = document.createElement("div");
      errDiv.style.color = "red";
      errDiv.textContent = "유효한 대화 데이터가 아닙니다.";
      const row = document.createElement("div");
      row.classList.add("row");
      row.innerHTML = `
        <div class="cell"></div>
        <div class="cell">${errDiv.outerHTML}</div>
        <div class="cell"></div>
      `;
      chatMessagesDiv.appendChild(row);
    }
  } catch (err) {
    // fetch 에러 처리: 중앙 셀에 표시
    const errDiv = document.createElement("div");
    errDiv.style.color = "red";
    errDiv.textContent = `오류: ${err.message}`;
    const row = document.createElement("div");
    row.classList.add("row");
    row.innerHTML = `
      <div class="cell"></div>
      <div class="cell">${errDiv.outerHTML}</div>
      <div class="cell"></div>
    `;
    chatMessagesDiv.appendChild(row);
  }
}

// (D) 헤더 테이블을 구성하는 함수: Phase별 Therapist count + Category + Concern
function buildHeaderTable(data) {
  const headerTbody = document.querySelector("#header-table tbody");

  // 먼저 therapist 발화만 추려서 각 Phase별 개수를 셈
  const allEntries = Array.isArray(data.dialogue_total) ? data.dialogue_total : [];
  const therapistEntries = allEntries.filter(e => e.role === "therapist");
  const totalTherapistCount = therapistEntries.length;

  const countExploring    = therapistEntries.filter(e => e.phase === "exploring").length;
  const countGuiding      = therapistEntries.filter(e => e.phase === "guiding").length;
  const countChoosing     = therapistEntries.filter(e => e.phase === "choosing").length;
  const countTerminating  = therapistEntries.filter(e => e.phase === "terminating").length;

  // ────────────────
  // 첫 번째 줄: Phase별 색상 + "(count/total)"
  // ────────────────
  const legendRow = document.createElement("tr");

  const thExploring = document.createElement("th");
  thExploring.textContent = `Exploring (${countExploring}/${totalTherapistCount})`;
  thExploring.classList.add("legend-cell", "legend-exploring");
  legendRow.appendChild(thExploring);

  const thGuiding = document.createElement("th");
  thGuiding.textContent = `Guiding (${countGuiding}/${totalTherapistCount})`;
  thGuiding.classList.add("legend-cell", "legend-guiding");
  legendRow.appendChild(thGuiding);

  const thChoosing = document.createElement("th");
  thChoosing.textContent = `Choosing (${countChoosing}/${totalTherapistCount})`;
  thChoosing.classList.add("legend-cell", "legend-choosing");
  legendRow.appendChild(thChoosing);

  const thTerminating = document.createElement("th");
  thTerminating.textContent = `Terminating (${countTerminating}/${totalTherapistCount})`;
  thTerminating.classList.add("legend-cell", "legend-terminating");
  legendRow.appendChild(thTerminating);

  headerTbody.appendChild(legendRow);

  // ────────────────
  // 두 번째 줄: Category (colspan=4)
  // ────────────────
  const categoryRow = document.createElement("tr");
  const tdCategory = document.createElement("td");
  tdCategory.setAttribute("colspan", "4");
  tdCategory.classList.add("category-cell");
  tdCategory.textContent = `Category: ${data.category || "N/A"}`;
  categoryRow.appendChild(tdCategory);
  headerTbody.appendChild(categoryRow);
}

// // (E) 한 개의 발화(entry)를 받아서 row를 만들고 셀에 message 삽입
// function appendRow({ role, statement, phase }) {
//   const chatMessagesDiv = document.getElementById("chat-messages");

//   // 1) row 요소 생성
//   const row = document.createElement("div");
//   row.classList.add("row");

//   // 2) 세 개의 빈 cell 생성
//   const cellTher   = document.createElement("div");
//   cellTher.classList.add("cell", "therapist");

//   const cellClient = document.createElement("div");
//   cellClient.classList.add("cell", "client");

//   const cellSC     = document.createElement("div");
//   cellSC.classList.add("cell", "sc_master");

//   // 3) 역할(role)에 맞춰 targetCell 지정
//   let targetCell;
//   if (role === "therapist") {
//     targetCell = cellTher;
//   } else if (role === "client") {
//     targetCell = cellClient;
//   } else if (role === "sc_master") {
//     targetCell = cellSC;
//   } else {
//     // 그 외 role은 중앙(client)에 추가
//     targetCell = cellClient;
//   }

//   // 4) .message 요소 생성
//   const msgDiv = document.createElement("div");
//   msgDiv.classList.add("message");
//   // sc_master는 회색으로 고정, 그 외에는 phase 클래스 추가
//   if (role !== "sc_master") {
//     msgDiv.classList.add(phase);
//   }

//   // 발화자 라벨
//   const roleLabel = document.createElement("span");
//   roleLabel.classList.add("role-label");
//   if (role === "sc_master") {
//     roleLabel.textContent = "SC Master";
//   } else {
//     roleLabel.textContent = role.charAt(0).toUpperCase() + role.slice(1);
//   }
//   msgDiv.appendChild(roleLabel);

//   // 발화문 줄바꿈 처리
//   const textSpan = document.createElement("span");
//   const fragment = document.createDocumentFragment();

//   // 만약 statement가 객체(dictionary)이면, 화면에 예쁘게 표시하기 위해 JSON 문자열로 변환합니다.
//   let statementText = statement;
//   if (typeof statementText === 'object' && statementText !== null) {
//     statementText = JSON.stringify(statementText, null, 2); // 2칸 들여쓰기로 포맷팅
//   }

//   statement.split("\n").forEach((line, idx) => {
//     fragment.appendChild(document.createTextNode(line));
//     if (idx < statement.split("\n").length - 1) {
//       fragment.appendChild(document.createElement("br"));
//     }
//   });
//   textSpan.appendChild(fragment);
//   msgDiv.appendChild(textSpan);

//   // 5) 완성된 msgDiv를 targetCell에 붙임
//   targetCell.appendChild(msgDiv);

//   // 6) 세 개의 셀을 row에 붙이고, chat-messages에 추가
//   row.appendChild(cellTher);
//   row.appendChild(cellClient);
//   row.appendChild(cellSC);
//   chatMessagesDiv.appendChild(row);
// }


// (E) 한 개의 발화(entry)를 받아서 row를 만들고 셀에 message 삽입
function appendRow({ role, statement, phase }) {
  const chatMessagesDiv = document.getElementById("chat-messages");

  // 1) row 요소 생성
  const row = document.createElement("div");
  row.classList.add("row");

  // 2) 세 개의 빈 cell 생성
  const cellTher   = document.createElement("div");
  cellTher.classList.add("cell", "therapist");

  const cellClient = document.createElement("div");
  cellClient.classList.add("cell", "client");

  const cellSC     = document.createElement("div");
  cellSC.classList.add("cell", "sc_master");

  // 3) 역할(role)에 맞춰 targetCell 지정
  let targetCell;
  if (role === "therapist") {
    targetCell = cellTher;
  } else if (role === "client") {
    targetCell = cellClient;
  } else if (role === "sc_master") {
    targetCell = cellSC;
  } else {
    targetCell = cellClient; // 그 외 role은 중앙(client)에 추가
  }

  // 4) .message 요소 생성
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  if (role !== "sc_master") {
    msgDiv.classList.add(phase);
  }

  // 발화자 라벨 추가
  const roleLabel = document.createElement("span");
  roleLabel.classList.add("role-label");
  if (role === "sc_master") {
    roleLabel.textContent = "SC Master";
  } else {
    roleLabel.textContent = role.charAt(0).toUpperCase() + role.slice(1);
  }
  msgDiv.appendChild(roleLabel);

  // --- ✨ 수정된 부분 시작 ✨ ---
  // 발화문(statement)을 안전하게 문자열로 변환
  let statementText;
  if (typeof statement === 'object' && statement !== null) {
    // 객체인 경우, JSON 문자열로 변환 (들여쓰기 2칸 적용)
    statementText = JSON.stringify(statement, null, 2);
  } else {
    // 객체가 아닌 경우(문자열, 숫자 등), String()으로 변환하여 안전하게 처리
    statementText = String(statement);
  }

  // 발화문을 화면에 표시
  const textSpan = document.createElement("span");
  const fragment = document.createDocumentFragment();

  // 이제 statementText는 항상 문자열이므로 .split()을 안전하게 사용할 수 있습니다.
  const lines = statementText.split('\n');
  lines.forEach((line, idx) => {
    fragment.appendChild(document.createTextNode(line));
    if (idx < lines.length - 1) {
      fragment.appendChild(document.createElement("br"));
    }
  });

  textSpan.appendChild(fragment);
  msgDiv.appendChild(textSpan);
  // --- ✨ 수정된 부분 끝 ✨ ---


  // 5) 완성된 msgDiv를 targetCell에 붙임
  targetCell.appendChild(msgDiv);

  // 6) 세 개의 셀을 row에 붙이고, chat-messages에 추가
  row.appendChild(cellTher);
  row.appendChild(cellClient);
  row.appendChild(cellSC);
  chatMessagesDiv.appendChild(row);
}