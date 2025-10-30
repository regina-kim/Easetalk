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

// (B) 파일 목록을 왼쪽에 렌더링view/0916_02
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
    const response = await fetch(`../../data/1030/${filename}`);
    if (!response.ok) throw new Error("파일을 불러오는 데 실패했습니다.");
    const data = await response.json();

    // 4) 헤더 테이블 구성 (Category + Total Count)
    buildHeaderTable(data);

    // [수정됨] data.concern 대신 data.input을 사용
    if (data.input) {
          const inputDiv = document.createElement('div');
          inputDiv.className = 'concern-display-area'; // CSS 클래스는 재사용
          inputDiv.textContent = `Input: ${data.input}`; // 표시 텍스트 변경
    
          // chat-messages의 첫 번째 자식(header-row) 뒤에 삽입
          const headerRow = chatMessagesDiv.querySelector('.header-row');
          if (headerRow) {
            headerRow.insertAdjacentElement('afterend', inputDiv);
          } else {
            // 혹시 모를 예외 처리
            chatMessagesDiv.prepend(inputDiv);
          }
        }


    // 5) dialogue을 순회하며 채팅 메시지 추가
    if (Array.isArray(data.dialogue)) {
      data.dialogue.forEach(entry => {
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

// (D) [수정됨] 헤더 테이블을 구성하는 함수: Category + Total Count
function buildHeaderTable(data) {
  const headerTbody = document.querySelector("#header-table tbody");
  headerTbody.innerHTML = ""; // 기존 내용 초기화

  // [수정됨] therapist와 client 발화만 카운트
  const allEntries = Array.isArray(data.dialogue) ? data.dialogue : [];
  const relevantEntries = allEntries.filter(e => e.role === "therapist" || e.role === "client");
  const totalDialogueCount = relevantEntries.length;

  // [수정됨] Phase별 색상 줄 대신 Category와 Total Count를 표시하는 한 줄 추가
  // ────────────────
  // 새 헤더: Category + Total Count
  // ────────────────
  const infoRow = document.createElement("tr");

  // Category Cell
  const tdCategory = document.createElement("td");
  tdCategory.classList.add("category-cell"); // 기존 스타일 재사용
  tdCategory.textContent = `Category: ${data.category || "N/A"}`;
  tdCategory.setAttribute("colspan", "2"); // 4칸 레이아웃 유지를 위해 2칸 사용
  infoRow.appendChild(tdCategory);

  // Total Count Cell
  const tdCount = document.createElement("td");
  tdCount.classList.add("category-cell"); // 기존 스타일 재사용
  tdCount.textContent = `Total Dialogues (T+C): ${totalDialogueCount}`;
  tdCount.setAttribute("colspan", "2"); // 4칸 레이아웃 유지를 위해 2칸 사용
  infoRow.appendChild(tdCount);

  headerTbody.appendChild(infoRow);
}

// (E) [수정됨] sc_master의 객체 content를 특별 처리
function appendRow({ role, content }) {
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
  
  // 발화자 라벨 추가
  const roleLabel = document.createElement("span");
  roleLabel.classList.add("role-label");
  if (role === "sc_master") {
    roleLabel.textContent = "SC Master";
  } else {
    roleLabel.textContent = role.charAt(0).toUpperCase() + role.slice(1);
  }
  msgDiv.appendChild(roleLabel);

  // --- ✨ 수정된 부분 시작 (sc_master 객체 처리) ✨ ---
  let contentText;
  
  // sc_master이고 content가 객체이며 determination 키를 가졌는지 확인
  if (role === 'sc_master' && typeof content === 'object' && content !== null && content.determination !== undefined) {
    // 요청하신 포맷으로 문자열 구성
    contentText = `determination: ${content.determination}\nreason: ${content.reason}`;
  } else if (typeof content === 'object' && content !== null) {
    // sc_master가 아니거나 예상치 못한 다른 객체일 경우, JSON으로 표시
    contentText = JSON.stringify(content, null, 2);
  } else {
    // Therapist, Client의 일반 문자열 처리
    contentText = String(content);
  }

  // 발화문을 화면에 표시 (줄바꿈 처리)
  const textSpan = document.createElement("span");
  const fragment = document.createDocumentFragment();

  const lines = contentText.split('\n');
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