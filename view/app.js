// window.FOLDERS 를 표로 렌더링
(function () {
  const mount = document.getElementById('folder-root');

  // 테이블 생성
  function renderTable(rows) {
    if (!rows || rows.length === 0) {
      mount.className = 'empty';
      mount.textContent = '표시할 폴더가 없습니다.';
      return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th style="width:40%">폴더</th>
          <th>메모</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    rows
      .slice() // 원본 보존
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'))
      .forEach(({ name, href, note }) => {
        const tr = document.createElement('tr');

        // 폴더 링크
        const tdName = document.createElement('td');
        const a = document.createElement('a');
        a.href = href || `./${name}/`;
        a.textContent = name;
        tdName.appendChild(a);

        // 메모 텍스트(읽기 전용: index.js에서 수정)
        const tdNote = document.createElement('td');
        tdNote.textContent = note || '';

        tr.appendChild(tdName);
        tr.appendChild(tdNote);
        tbody.appendChild(tr);
      });

    mount.className = '';
    mount.innerHTML = '';
    mount.appendChild(table);
  }

  // 전역 데이터 확인
  if (!window.FOLDERS) {
    mount.className = 'empty';
    mount.textContent = '데이터(index.js)가 로드되지 않았습니다.';
  } else {
    renderTable(window.FOLDERS);
  }
})();
