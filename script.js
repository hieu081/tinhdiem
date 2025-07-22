let manualSubjects = JSON.parse(localStorage.getItem("manualSubjects")) || [];
let excelStudentData =
  JSON.parse(localStorage.getItem("excelStudentData")) || {};
let excelSubjects = JSON.parse(localStorage.getItem("excelSubjects")) || [];
let excelCredits = JSON.parse(localStorage.getItem("excelCredits")) || {};
let recentActivities =
  JSON.parse(localStorage.getItem("recentActivities")) || [];
let editIndex = null;
let currentPage = 1;
const itemsPerPage = 10;
let filteredStudents = [];
let subjectSuggestions = new Set();

document.addEventListener("DOMContentLoaded", function () {
  initializeComponents();
  updateManualSubjectList();
  updateRecentActivities();
  loadSubjectSuggestions();
});

const addManualSubjectBtn = document.getElementById("addManualSubject");
const addMultipleSubjectsBtn = document.getElementById("addMultipleSubjects");
const importManualSubjectsBtn = document.getElementById("importManualSubjects");
const exportManualSubjectsBtn = document.getElementById("exportManualSubjects");
const calculateManualGPABtn = document.getElementById("calculateManualGPA");
const resetManualFormBtn = document.getElementById("resetManualForm");
const manualSubjectList = document.getElementById("manualSubjectList");
const manualMessage = document.getElementById("manualMessage");
const manualResultContainer = document.getElementById("manualResultContainer");
const manualGpaResult = document.getElementById("manualGpaResult");
const manualGradeDetails = document.getElementById("manualGradeDetails");
const manualSubjectNameInput = document.getElementById("manualSubjectName");
const manualSubjectCreditInput = document.getElementById("manualSubjectCredit");
const manualSubjectGradeInput = document.getElementById("manualSubjectGrade");

addManualSubjectBtn.addEventListener("click", addManualSubject);
addMultipleSubjectsBtn.addEventListener("click", showMultipleSubjectsModal);
importManualSubjectsBtn.addEventListener("click", importManualSubjects);
exportManualSubjectsBtn.addEventListener("click", exportManualSubjects);
calculateManualGPABtn.addEventListener("click", calculateManualGPA);
resetManualFormBtn.addEventListener("click", resetManualForm);
manualSubjectNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addManualSubjectBtn.click();
});

const importExcelBtn = document.getElementById("importExcel");
const downloadTemplateBtn = document.getElementById("downloadTemplate");
const previewExcelBtn = document.getElementById("previewExcel");
const searchStudentInput = document.getElementById("searchStudent");
const calculateExcelGPABtn = document.getElementById("calculateExcelGPA");
const exportExcelBtn = document.getElementById("exportExcel");
const resetExcelFormBtn = document.getElementById("resetExcelForm");
const excelMessage = document.getElementById("excelMessage");
const creditsContainer = document.getElementById("creditsContainer");
const creditsInputs = document.getElementById("creditsInputs");
const saveCreditsBtn = document.getElementById("saveCredits");
const excelTableBody = document.getElementById("excelTableBody");
const excelSubjectList = document.getElementById("excelSubjectList");
const loadingSpinner = document.getElementById("loadingSpinner");
const excelPreview = document.getElementById("excelPreview");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const totalStudents = document.getElementById("totalStudents");
const excelDropzone = document.getElementById("excelDropzone");
const browseExcelFile = document.getElementById("browseExcelFile");
const excelFile = document.getElementById("excelFile");

importExcelBtn.addEventListener("click", importExcelData);
downloadTemplateBtn.addEventListener("click", downloadExcelTemplate);
previewExcelBtn.addEventListener("click", previewExcelData);
saveCreditsBtn.addEventListener("click", saveSubjectCredits);
calculateExcelGPABtn.addEventListener("click", calculateExcelGPA);
exportExcelBtn.addEventListener("click", exportExcelResults);
resetExcelFormBtn.addEventListener("click", resetExcelForm);
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) updateExcelTable(currentPage - 1);
});
nextPageBtn.addEventListener("click", () => {
  if (currentPage < Math.ceil(filteredStudents.length / itemsPerPage))
    updateExcelTable(currentPage + 1);
});
searchStudentInput.addEventListener("input", debounce(searchStudents, 300));
browseExcelFile.addEventListener("click", () => excelFile.click());
excelFile.addEventListener("change", handleFileSelect);

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  excelDropzone.addEventListener(eventName, preventDefaults, false);
});

["dragenter", "dragover"].forEach((eventName) => {
  excelDropzone.addEventListener(eventName, highlight, false);
});

["dragleave", "drop"].forEach((eventName) => {
  excelDropzone.addEventListener(eventName, unhighlight, false);
});

excelDropzone.addEventListener("drop", handleDrop, false);

const multipleSubjectsModal = document.getElementById("multipleSubjectsModal");
const closeMultipleSubjectsModal = document.getElementById(
  "closeMultipleSubjectsModal"
);
const cancelMultipleSubjects = document.getElementById(
  "cancelMultipleSubjects"
);
const submitMultipleSubjects = document.getElementById(
  "submitMultipleSubjects"
);
const multipleSubjectsInput = document.getElementById("multipleSubjectsInput");

closeMultipleSubjectsModal.addEventListener("click", () => {
  multipleSubjectsModal.classList.add("hidden");
});
cancelMultipleSubjects.addEventListener("click", () => {
  multipleSubjectsModal.classList.add("hidden");
});
submitMultipleSubjects.addEventListener("click", addMultipleSubjects);

const helpModal = document.getElementById("helpModal");
const helpBtn = document.getElementById("helpBtn");
const closeHelpModal = document.getElementById("closeHelpModal");

helpBtn.addEventListener("click", () => {
  helpModal.classList.remove("hidden");
});
closeHelpModal.addEventListener("click", () => {
  helpModal.classList.add("hidden");
});

const studentDetailModal = document.getElementById("studentDetailModal");
const closeStudentDetailModal = document.getElementById(
  "closeStudentDetailModal"
);

closeStudentDetailModal.addEventListener("click", () => {
  studentDetailModal.classList.add("hidden");
});

const quickCalculateBtn = document.getElementById("quickCalculate");
const quickImportBtn = document.getElementById("quickImport");
const quickExportBtn = document.getElementById("quickExport");

quickCalculateBtn.addEventListener("click", () => {
  openTab("manualTab");
  calculateManualGPA();
});
quickImportBtn.addEventListener("click", () => openTab("excelTab"));
quickExportBtn.addEventListener("click", exportExcelResults);

function initializeComponents() {
  updateManualSubjectList();
  updateRecentActivities();
  loadSubjectSuggestions();
  if (Object.keys(excelStudentData).length > 0 && excelSubjects.length > 0) {
    if (Object.keys(excelCredits).length === excelSubjects.length) {
      calculateExcelGPA();
      creditsContainer.classList.add("hidden");
    } else {
      creditsInputs.innerHTML = excelSubjects
        .map(
          (subject) => `
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-800 mb-1">${subject}:</label>
                    <div class="flex items-center">
                        <input type="number" min="1" max="20" value="${
                          excelCredits[subject] || 3
                        }"
                            class="credit-input w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            id="excelCredit_${subject.replace(/\s+/g, "_")}">
                        <span class="ml-2 text-sm">tín chỉ</span>
                    </div>
                </div>
              `
        )
        .join("");
      creditsContainer.classList.remove("hidden");
      showMessage(
        "Vui lòng nhập số tín chỉ cho các môn học",
        "warning",
        excelMessage
      );
    }
  }
}

function addManualSubject() {
  const subjectName = manualSubjectNameInput.value.trim();
  const subjectCredit = parseInt(manualSubjectCreditInput.value);
  const subjectGrade = parseFloat(manualSubjectGradeInput.value);

  if (!subjectName) {
    showMessage("Vui lòng nhập tên môn học", "error", manualMessage);
    return;
  }
  if (isNaN(subjectCredit) || subjectCredit < 1 || subjectCredit > 20) {
    showMessage("Số tín chỉ không hợp lệ (1-20)", "error", manualMessage);
    return;
  }

  const subject = {
    name: subjectName,
    credit: subjectCredit,
    grade: subjectGrade,
    addedAt: new Date().toISOString(),
  };

  if (editIndex !== null) {
    manualSubjects[editIndex] = subject;
    editIndex = null;
    addManualSubjectBtn.innerHTML =
      '<i class="fas fa-plus-circle mr-2"></i> Thêm môn học';
    showMessage("Đã cập nhật môn học", "success", manualMessage);
    addActivity(`Cập nhật môn học: ${subjectName}`);
  } else {
    manualSubjects.push(subject);
    if (subjectGrade === 0) {
      showMessage(
        `Cảnh báo: Môn ${subjectName} không đạt (F)`,
        "error",
        manualMessage
      );
    } else {
      showMessage(`Đã thêm môn ${subjectName}`, "success", manualMessage);
    }
    addActivity(`Thêm môn học mới: ${subjectName}`);
    subjectSuggestions.add(subjectName);
    updateSubjectSuggestions();
  }

  saveManualSubjects();
  updateManualSubjectList();
  resetManualFormInputs();
}

function showMultipleSubjectsModal() {
  multipleSubjectsModal.classList.remove("hidden");
  multipleSubjectsInput.focus();
}

function addMultipleSubjects() {
  const inputText = multipleSubjectsInput.value.trim();
  if (!inputText) {
    showMessage("Vui lòng nhập dữ liệu môn học", "error", manualMessage);
    return;
  }

  const lines = inputText.split("\n").filter((line) => line.trim());
  let addedCount = 0;
  let errorCount = 0;

  lines.forEach((line) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length === 3) {
      const name = parts[0];
      const credit = parseInt(parts[1]);
      const gradeText = parts[2].toUpperCase();
      const gradeMap = {
        A: 4,
        "B+": 3.5,
        B: 3,
        "C+": 2.5,
        C: 2,
        "D+": 1.5,
        D: 1,
        F: 0,
      };

      if (
        name &&
        !isNaN(credit) &&
        credit >= 1 &&
        credit <= 20 &&
        gradeMap.hasOwnProperty(gradeText)
      ) {
        manualSubjects.push({
          name: name,
          credit: credit,
          grade: gradeMap[gradeText],
          addedAt: new Date().toISOString(),
        });
        subjectSuggestions.add(name);
        addedCount++;
      } else {
        errorCount++;
      }
    } else {
      errorCount++;
    }
  });

  if (addedCount > 0) {
    saveManualSubjects();
    updateManualSubjectList();
    showMessage(
      `Đã thêm ${addedCount} môn học, ${errorCount} lỗi`,
      "success",
      manualMessage
    );
    addActivity(`Thêm ${addedCount} môn học cùng lúc`);
    updateSubjectSuggestions();
  } else {
    showMessage(
      "Không thể thêm môn học nào, vui lòng kiểm tra định dạng",
      "error",
      manualMessage
    );
  }

  multipleSubjectsModal.classList.add("hidden");
  multipleSubjectsInput.value = "";
}

function importManualSubjects() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,.csv,.xlsx,.xls";

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        let importedSubjects = [];
        if (file.name.endsWith(".json")) {
          importedSubjects = JSON.parse(e.target.result);
        } else if (file.name.endsWith(".csv")) {
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        }

        if (Array.isArray(importedSubjects) && importedSubjects.length > 0) {
          manualSubjects = manualSubjects.concat(importedSubjects);
          saveManualSubjects();
          updateManualSubjectList();
          showMessage(
            `Đã import ${importedSubjects.length} môn học`,
            "success",
            manualMessage
          );
          addActivity(`Import ${importedSubjects.length} môn học từ file`);

          importedSubjects.forEach((subj) => subjectSuggestions.add(subj.name));
          updateSubjectSuggestions();
        }
      } catch (error) {
        showMessage(
          "Lỗi khi đọc file: " + error.message,
          "error",
          manualMessage
        );
      }
    };
    reader.readAsText(file);
  };

  fileInput.click();
}

function exportManualSubjects() {
  if (manualSubjects.length === 0) {
    showMessage("Không có dữ liệu để xuất", "error", manualMessage);
    return;
  }

  const dataStr = JSON.stringify(manualSubjects, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = "danh_sach_mon_hoc.json";
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();

  addActivity("Xuất danh sách môn học ra file JSON");
}

function calculateManualGPA() {
  if (manualSubjects.length === 0) {
    showMessage("Vui lòng thêm ít nhất một môn học", "error", manualMessage);
    return;
  }

  let totalGradePoints = 0;
  let totalCredits = 0;
  let detailsHTML =
    "<p class='text-sm font-medium mb-2'>Chi tiết từng môn:</p><ul class='list-disc pl-5 space-y-1'>";

  manualSubjects.forEach((subject) => {
    totalGradePoints += subject.grade * subject.credit;
    totalCredits += subject.credit;
    const isFailed = subject.grade === 0;
    detailsHTML += `
            <li class="${isFailed ? "failed-subject" : ""}">
              ${subject.name} (${subject.credit} tín chỉ): ${gradeToLetter(
      subject.grade
    )} (${subject.grade.toFixed(1)}${isFailed ? ", Không đạt" : ""})
            </li>
          `;
  });

  const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
  manualGpaResult.innerHTML = `
          <div class="flex items-center justify-center">
            <span class="mr-2">Điểm trung bình hệ 4:</span>
            <span class="text-3xl font-bold ${getGpaColorClass(
              gpa
            )}">${gpa.toFixed(2)}</span>
          </div>
        `;

  if (gpa < 2.0) {
    showMessage(
      "Cảnh báo: Điểm trung bình thấp, cần cải thiện!",
      "error",
      manualMessage
    );
  }

  manualGradeDetails.innerHTML = detailsHTML + "</ul>";
  manualResultContainer.classList.remove("hidden");
  manualResultContainer.scrollIntoView({ behavior: "smooth" });

  addActivity(`Tính điểm TB hệ 4: ${gpa.toFixed(2)}`);
}

function resetManualForm() {
  if (confirm("Bạn có chắc muốn xóa tất cả môn học?")) {
    manualSubjects = [];
    saveManualSubjects();
    updateManualSubjectList();
    manualResultContainer.classList.add("hidden");
    showMessage("Đã xóa tất cả môn học", "success", manualMessage);
    addActivity("Xóa tất cả môn học");
  }
}

function updateManualSubjectList() {
  if (manualSubjects.length === 0) {
    manualSubjectList.innerHTML = `
            <div class="text-center py-8">
              <i class="fas fa-book-open text-4xl text-gray-300 mb-3"></i>
              <p class="text-gray-500">Chưa có môn học nào được thêm</p>
            </div>
          `;
    return;
  }

  manualSubjectList.innerHTML = manualSubjects
    .map(
      (subject, index) => `
              <div class="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg mb-2 hover:shadow transition-all ${
                subject.grade === 0 ? "border-l-4 border-l-red-500" : ""
              }">
                <div class="${subject.grade === 0 ? "failed-subject" : ""}">
                  <strong>${subject.name}</strong> - ${
        subject.credit
      } tín chỉ - ${gradeToLetter(subject.grade)} (${subject.grade.toFixed(1)}${
        subject.grade === 0 ? ", Không đạt" : ""
      })
                </div>
                <div class="flex space-x-2">
                  <button onclick="editManualSubject(${index})" class="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm transition-colors">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="removeManualSubject(${index})" class="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `
    )
    .join("");
}

function editManualSubject(index) {
  const subject = manualSubjects[index];
  manualSubjectNameInput.value = subject.name;
  manualSubjectCreditInput.value = subject.credit;
  manualSubjectGradeInput.value = subject.grade;
  editIndex = index;
  addManualSubjectBtn.innerHTML =
    '<i class="fas fa-save mr-2"></i> Cập nhật môn học';
  manualSubjectNameInput.focus();
}

function removeManualSubject(index) {
  const subjectName = manualSubjects[index].name;
  manualSubjects.splice(index, 1);
  saveManualSubjects();
  updateManualSubjectList();
  showMessage(`Đã xóa môn ${subjectName}`, "success", manualMessage);
  addActivity(`Xóa môn học: ${subjectName}`);
}

function saveManualSubjects() {
  localStorage.setItem("manualSubjects", JSON.stringify(manualSubjects));
}

function resetManualFormInputs() {
  manualSubjectNameInput.value = "";
  manualSubjectCreditInput.value = "3";
  manualSubjectGradeInput.value = "3";
  editIndex = null;
  addManualSubjectBtn.innerHTML =
    '<i class="fas fa-plus-circle mr-2"></i> Thêm môn học';
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  excelDropzone.classList.add("active");
}

function unhighlight() {
  excelDropzone.classList.remove("active");
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  excelFile.files = files;
  handleFileSelect({ target: { files } });
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (files.length > 0) {
    previewExcelBtn.classList.remove("hidden");
    showMessage(`Đã chọn file: ${files[0].name}`, "success", excelMessage);
  }
}

async function importExcelData() {
  const file = excelFile.files[0];
  if (!file) {
    showMessage("Vui lòng chọn file Excel", "error", excelMessage);
    return;
  }

  loadingSpinner.classList.remove("hidden");
  showMessage("Đang xử lý file Excel...", "", excelMessage);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    excelStudentData = {};
    excelSubjects = [];

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (jsonData.length === 0) return;

      excelSubjects.push(sheetName);

      jsonData.forEach((row) => {
        const studentId = row["Mã SV"] || row["maSV"] || "";
        const lastName = row["Họ lót"] || row["hoLot"] || "";
        const firstName = row["Tên"] || row["ten"] || "";
        let score =
          row["Điểm thi"] ||
          row["diemThi"] ||
          row["Điểm TK số"] ||
          row["diemTKSo"] ||
          "";

        if (!studentId) return;

        if (score === "Không đạt" || score === "") {
          score = 0;
        } else {
          score = parseFloat(score);
          if (isNaN(score)) score = 0;
        }

        if (!excelStudentData[studentId]) {
          excelStudentData[studentId] = {
            studentId,
            lastName,
            firstName,
            scores: {},
            scores4: {},
            failedSubjects: [],
          };
        }

        excelStudentData[studentId].scores[sheetName] = score;
        const score4 = convertScoreTo4Scale(score);
        excelStudentData[studentId].scores4[sheetName] = score4;
        if (score4 === 0) {
          excelStudentData[studentId].failedSubjects.push(sheetName);
        }
      });
    });

    localStorage.setItem("excelStudentData", JSON.stringify(excelStudentData));
    localStorage.setItem("excelSubjects", JSON.stringify(excelSubjects));

    creditsInputs.innerHTML = excelSubjects
      .map(
        (subject) => `
                <div class="mb-3">
                  <label class="block text-sm font-medium text-gray-800 mb-1">${subject}:</label>
                  <div class="flex items-center">
                    <input type="number" min="1" max="20" value="${
                      excelCredits[subject] || 3
                    }"
                      class="credit-input w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      id="excelCredit_${subject.replace(/\s+/g, "_")}">
                    <span class="ml-2 text-sm">tín chỉ</span>
                  </div>
                </div>
              `
      )
      .join("");

    creditsContainer.classList.remove("hidden");
    calculateExcelGPABtn.classList.add("hidden");
    exportExcelBtn.classList.add("hidden");
    resetExcelFormBtn.classList.remove("hidden");

    showMessage(
      `Đã đọc dữ liệu từ ${excelSubjects.length} môn học và ${
        Object.keys(excelStudentData).length
      } sinh viên. Vui lòng nhập số tín chỉ và lưu cấu hình.`,
      "success",
      excelMessage
    );

    addActivity(`Import dữ liệu từ file Excel: ${file.name}`);
  } catch (error) {
    showMessage(
      "Lỗi khi đọc file Excel: " + error.message,
      "error",
      excelMessage
    );
    addActivity(`Lỗi khi import file Excel: ${error.message}`);
  } finally {
    loadingSpinner.classList.add("hidden");
  }
}

function previewExcelData() {
  const file = excelFile.files[0];
  if (!file) {
    showMessage("Vui lòng chọn file Excel trước", "error", excelMessage);
    return;
  }

  loadingSpinner.classList.remove("hidden");
  excelPreview.innerHTML = "";

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      excelPreview.classList.remove("hidden");
      excelPreview.innerHTML =
        "<h4 class='font-medium mb-2'>Xem trước dữ liệu:</h4>";

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);

        const sheetDiv = document.createElement("div");
        sheetDiv.className = "mb-6";
        sheetDiv.innerHTML = `<h5 class='font-medium mb-2'>Sheet: ${sheetName}</h5>${html}`;
        excelPreview.appendChild(sheetDiv);
      });

      showMessage("Đã tạo bản xem trước thành công", "success", excelMessage);
    } catch (error) {
      showMessage(
        "Lỗi khi xem trước file: " + error.message,
        "error",
        excelMessage
      );
    } finally {
      loadingSpinner.classList.add("hidden");
    }
  };

  reader.readAsArrayBuffer(file);
}

function downloadExcelTemplate() {
  const templateData = [
    {
      "Mã SV": "670001",
      "Họ lót": "Nguyễn Văn",
      Tên: "A",
      "Mã lớp": "K67CNCDTA",
      "Điểm thi": 8.5,
      "Điểm TK số": 4,
      "Điểm TK chữ": "A",
    },
    {
      "Mã SV": "670002",
      "Họ lót": "Trần Thị",
      Tên: "B",
      "Mã lớp": "K67CNCDTA",
      "Điểm thi": 7.3,
      "Điểm TK số": 3,
      "Điểm TK chữ": "B",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu mẫu");
  XLSX.writeFile(wb, "Mau_diem_sinh_vien.xlsx");

  addActivity("Tải về mẫu file Excel");
}

function saveSubjectCredits() {
  excelCredits = {};
  let allCreditsEntered = true;

  excelSubjects.forEach((subject) => {
    const subjectKey = subject.replace(/\s+/g, "_");
    const creditInput = document.getElementById(`excelCredit_${subjectKey}`);
    const creditValue = parseInt(creditInput.value);
    if (!creditValue || creditValue < 1 || creditValue > 20) {
      allCreditsEntered = false;
      showMessage(
        `Số tín chỉ cho môn ${subject} không hợp lệ (1-20)`,
        "error",
        excelMessage
      );
      return;
    }
    excelCredits[subject] = creditValue;
  });

  if (allCreditsEntered) {
    localStorage.setItem("excelCredits", JSON.stringify(excelCredits));
    creditsContainer.classList.add("hidden");
    calculateExcelGPABtn.classList.remove("hidden");
    showMessage(
      `Đã lưu tín chỉ cho ${excelSubjects.length} môn học`,
      "success",
      excelMessage
    );
    addActivity("Cập nhật số tín chỉ các môn học");
    calculateExcelGPA();
  }
}

function calculateExcelGPA() {
  if (
    Object.keys(excelStudentData).length === 0 ||
    excelSubjects.length === 0
  ) {
    showMessage("Chưa có dữ liệu để tính toán", "error", excelMessage);
    return;
  }

  const missingCredits = excelSubjects.filter(
    (subject) => !excelCredits[subject] || excelCredits[subject] < 1
  );
  if (missingCredits.length > 0) {
    showMessage(
      `Vui lòng nhập số tín chỉ cho các môn: ${missingCredits.join(", ")}`,
      "error",
      excelMessage
    );
    creditsContainer.classList.remove("hidden");
    return;
  }

  filteredStudents = Object.values(excelStudentData)
    .map((student) => {
      let totalScore = 0;
      let totalCredits = 0;

      excelSubjects.forEach((subject) => {
        if (
          student.scores4[subject] !== undefined &&
          student.scores[subject] !== ""
        ) {
          totalScore += student.scores4[subject] * excelCredits[subject];
          totalCredits += excelCredits[subject];
        }
      });

      student.averageScore4 = totalCredits > 0 ? totalScore / totalCredits : 0;
      return student;
    })
    .sort((a, b) => b.averageScore4 - a.averageScore4);

  filteredStudents.forEach((student, index) => {
    student.rank = index + 1;
  });

  updateExcelTable(1);
  excelSubjectList.classList.remove("hidden");
  exportExcelBtn.classList.remove("hidden");

  showMessage("Đã tính toán điểm trung bình hệ 4", "success", excelMessage);
  addActivity("Tính toán điểm TB hệ 4 từ dữ liệu Excel");
}

function updateExcelTable(page) {
  currentPage = page;
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(start, end);

  excelTableBody.innerHTML = paginatedStudents
    .map((student, index) => {
      let subjectDetails = excelSubjects
        .map((subject) => {
          if (
            student.scores[subject] !== undefined &&
            student.scores[subject] !== ""
          ) {
            const isFailed = student.scores4[subject] === 0;
            return `
                    <div class="mb-1 ${isFailed ? "failed-subject" : ""}">
                      <span class="font-medium">${subject}:</span>
                      ${
                        student.scores[subject] === 0
                          ? "Không đạt"
                          : student.scores[subject].toFixed(1)
                      }
                      (${convertToLetterGrade(student.scores4[subject])}${
              isFailed ? ", Không đạt" : ""
            })
                    </div>
                  `;
          }
          return `<div class="mb-1"><span class="font-medium ${subject}">-</span></div>`;
        })
        .join("");

      return `
              <tr class="hover:bg-gray-50">
                <td class="border p-2 sm:p-3">${start + index + 1}</td>
                <td class="border p-2 sm:p-3 font-medium">${
                  student.studentId
                }</td>
                <td class="border p-2 sm:p-3">${student.lastName} ${
        student.firstName
      }</td>
                <td class="border p-2 sm:p-3 font-medium ${getGpaColorClass(
                  student.averageScore4
                )}">${student.averageScore4.toFixed(2)}</td>
                <td class="border p-2 sm:p-3 text-sm">${subjectDetails}</td>
                <td class="border p-2 sm:p-3">
                  <button onclick="showStudentDetail('${
                    student.studentId
                  }')" class="px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm">
                    <i class="fas fa-info-circle"></i>
                  </button>
                </td>
              </tr>
            `;
    })
    .join("");

  totalStudents.textContent = `Tổng số sinh viên: ${filteredStudents.length}`;
  pageInfo.textContent = `Trang ${currentPage} / ${Math.ceil(
    filteredStudents.length / itemsPerPage
  )}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled =
    currentPage === Math.ceil(filteredStudents.length / itemsPerPage);
}

function searchStudents() {
  const searchTerm = searchStudentInput.value.toLowerCase();

  filteredStudents = Object.values(excelStudentData).filter((student) => {
    const studentId = student.studentId
      ? String(student.studentId).toLowerCase()
      : "";
    const fullName = `${student.lastName || ""} ${
      student.firstName || ""
    }`.toLowerCase();
    return studentId.includes(searchTerm) || fullName.includes(searchTerm);
  });

  updateExcelTable(1);

  excelSubjectList.classList.remove("hidden");
  exportExcelBtn.classList.remove("hidden");

  showMessage("Đã tính toán điểm trung bình hệ 4", "success", excelMessage);
  addActivity("Tính toán điểm TB hệ 4 từ dữ liệu Excel");
}
function updateExcelTable(page) {
  currentPage = page;
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(start, end);

  excelTableBody.innerHTML = paginatedStudents
    .map((student) => {
      let subjectDetails = excelSubjects
        .filter(
          (subject) =>
            student.scores[subject] !== undefined &&
            student.scores[subject] !== ""
        )
        .map((subject) => {
          const isFailed = student.scores4[subject] === 0;
          return `
            <div class="mb-1 ${isFailed ? "failed-subject" : ""}">
              <span class="font-medium">${subject}:</span>
              ${
                student.scores[subject] === 0
                  ? "Không đạt"
                  : student.scores[subject].toFixed(1)
              }
              (${convertToLetterGrade(student.scores4[subject])}${
            isFailed ? ", Không đạt" : ""
          })
            </div>
          `;
        })
        .join("");

      if (!subjectDetails) {
        subjectDetails =
          '<div class="text-gray-500 text-sm">Không có dữ liệu điểm</div>';
      }

      return `
        <tr class="hover:bg-gray-50">
          <td class="border p-2 sm:p-3" data-label="Rank">${student.rank}</td>
          <td class="border p-2 sm:p-3 font-medium" data-label="Mã SV">${
            student.studentId
          }</td>
          <td class="border p-2 sm:p-3" data-label="Họ và tên">${
            student.lastName
          } ${student.firstName}</td>
          <td class="border p-2 sm:p-3 font-medium ${getGpaColorClass(
            student.averageScore4
          )}" data-label="Điểm TB hệ 4">${student.averageScore4.toFixed(2)}</td>
          <td class="border p-2 sm:p-3 text-sm" data-label="Chi tiết môn">${subjectDetails}</td>
          <td class="border p-2 sm:p-3" data-label="Hành động">
            <button onclick="showStudentDetail('${
              student.studentId
            }')" class="px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm">
              <i class="fas fa-info-circle"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  pageInfo.textContent = `Trang ${currentPage} / ${Math.ceil(
    filteredStudents.length / itemsPerPage
  )}`;
  totalStudents.textContent = `Tổng số sinh viên: ${filteredStudents.length}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled =
    currentPage === Math.ceil(filteredStudents.length / itemsPerPage);

  if (window.innerWidth <= 768) {
    document
      .querySelectorAll(".table td:nth-child(5), .table th:nth-child(5)")
      .forEach((el) => {
        el.style.display = "none";
      });
  } else {
    document
      .querySelectorAll(".table td:nth-child(5), .table th:nth-child(5)")
      .forEach((el) => {
        el.style.display = "";
      });
  }
}

function showStudentDetail(studentId) {
  const student = excelStudentData[studentId];
  if (!student) {
    showMessage("Không tìm thấy thông tin sinh viên", "error", excelMessage);
    return;
  }

  const content = `
    <p><strong>Mã SV:</strong> ${student.studentId}</p>
    <p><strong>Họ và tên:</strong> ${student.lastName} ${student.firstName}</p>
    <p><strong>Điểm trung bình hệ 4:</strong> <span class="${getGpaColorClass(
      student.averageScore4
    )}">${student.averageScore4.toFixed(2)}</span></p>
    <p><strong>Xếp loại:</strong> ${getGradeClassification(
      student.averageScore4
    )}</p>
    <h4 class="font-medium mt-4 mb-2">Chi tiết điểm môn học:</h4>
    <div class="space-y-2">
      ${excelSubjects
        .filter(
          (subject) =>
            student.scores[subject] !== undefined &&
            student.scores[subject] !== ""
        )
        .map((subject) => {
          const score = student.scores[subject];
          const score4 = student.scores4[subject];
          const isFailed = score4 === 0;
          return `
            <p class="${isFailed ? "failed-subject" : ""}">
              <span class="font-medium">${subject}:</span>
              ${score === 0 ? "Không đạt" : score.toFixed(1)}
              (${convertToLetterGrade(score4)}${isFailed ? ", Không đạt" : ""})
              ${
                excelCredits[subject]
                  ? `(${excelCredits[subject]} tín chỉ)`
                  : ""
              }
            </p>
          `;
        })
        .join("")}
    </div>
    ${
      student.failedSubjects.length > 0
        ? `<p class="failed-subject mt-4"><strong>Môn không đạt:</strong> ${student.failedSubjects.join(
            ", "
          )}</p>`
        : ""
    }
  `;

  document.getElementById("studentDetailContent").innerHTML = content;
  studentDetailModal.classList.remove("hidden");
}

function searchStudents() {
  const searchTerm = searchStudentInput.value.toLowerCase();
  filteredStudents = Object.values(excelStudentData)
    .filter((student) => {
      const studentId = student.studentId ? String(student.studentId) : "";
      const fullName = `${student.lastName || ""} ${student.firstName || ""}`;
      return (
        studentId.toLowerCase().includes(searchTerm) ||
        fullName.toLowerCase().includes(searchTerm)
      );
    })
    .map((student) => {
      let totalScore = 0;
      let totalCredits = 0;

      excelSubjects.forEach((subject) => {
        if (
          student.scores4[subject] !== undefined &&
          student.scores[subject] !== ""
        ) {
          totalScore += student.scores4[subject] * (excelCredits[subject] || 3);
          totalCredits += excelCredits[subject] || 3;
        }
      });

      student.averageScore4 = totalCredits > 0 ? totalScore / totalCredits : 0;
      return student;
    })
    .sort((a, b) => b.averageScore4 - a.averageScore4);

  updateExcelTable(1);
}

function exportExcelResults() {
  if (Object.keys(excelStudentData).length === 0) {
    showMessage("Chưa có dữ liệu để xuất", "error", excelMessage);
    return;
  }

  const exportData = filteredStudents.map((student, index) => {
    const row = {
      STT: index + 1,
      "Mã SV": student.studentId,
      "Họ và tên": `${student.lastName} ${student.firstName}`,
      "Điểm TB hệ 4": student.averageScore4.toFixed(2),
      "Xếp loại": getGradeClassification(student.averageScore4),
      "Môn không đạt": student.failedSubjects.join(", ") || "Không có",
    };

    excelSubjects.forEach((subject) => {
      row[subject] =
        student.scores[subject] !== undefined && student.scores[subject] !== ""
          ? student.scores[subject] === 0
            ? "Không đạt"
            : `${student.scores[subject].toFixed(1)} (${convertToLetterGrade(
                student.scores4[subject]
              )})`
          : "-";
    });

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bảng điểm hệ 4");
  XLSX.writeFile(wb, "Bang_diem_he_4.xlsx");

  addActivity("Xuất báo cáo điểm ra file Excel");
}

function resetExcelForm() {
  if (confirm("Bạn có chắc muốn xóa tất cả dữ liệu Excel?")) {
    excelStudentData = {};
    excelSubjects = [];
    excelCredits = {};

    localStorage.removeItem("excelStudentData");
    localStorage.removeItem("excelSubjects");
    localStorage.removeItem("excelCredits");

    excelTableBody.innerHTML = "";
    creditsContainer.classList.add("hidden");
    excelSubjectList.classList.add("hidden");
    calculateExcelGPABtn.classList.add("hidden");
    exportExcelBtn.classList.add("hidden");
    resetExcelFormBtn.classList.add("hidden");
    excelFile.value = "";
    excelPreview.classList.add("hidden");
    previewExcelBtn.classList.add("hidden");

    showMessage("Đã xóa tất cả dữ liệu", "success", excelMessage);
    addActivity("Xóa toàn bộ dữ liệu Excel");
  }
}

// ========== CÁC HÀM HỖ TRỢ ==========
function openTab(tabId) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.add("hidden");
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("bg-blue-600", "text-white");
    tab.classList.add("bg-gray-200");
  });

  const selectedTab = document.getElementById(tabId);
  selectedTab.classList.remove("hidden");
  selectedTab.classList.add("active");

  const tabButton = document.querySelector(
    `button[onclick="openTab('${tabId}')"]`
  );
  tabButton.classList.add("bg-blue-600", "text-white");
  tabButton.classList.remove("bg-gray-200");

  addActivity(
    `Mở tab: ${tabId === "manualTab" ? "Nhập Thủ Công" : "Import từ Excel"}`
  );
}

function showMessage(message, type, element) {
  element.classList.remove(
    "hidden",
    "bg-red-100",
    "bg-green-100",
    "text-red-600",
    "text-green-600"
  );
  element.textContent = message;
  if (type === "error") {
    element.classList.add("bg-red-100", "text-red-600");
  } else if (type === "success") {
    element.classList.add("bg-green-100", "text-green-600");
  }
  element.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    element.classList.add("hidden");
  }, 5000);
}

function addActivity(activity) {
  recentActivities.unshift({
    activity,
    timestamp: new Date().toISOString(),
  });
  if (recentActivities.length > 5) recentActivities.pop();
  localStorage.setItem("recentActivities", JSON.stringify(recentActivities));
  updateRecentActivities();
}

function updateRecentActivities() {
  const recentActivitiesDiv = document.getElementById("recentActivities");
  if (recentActivities.length === 0) {
    recentActivitiesDiv.innerHTML =
      '<div class="text-sm text-gray-500 italic">Chưa có hoạt động nào</div>';
    return;
  }

  recentActivitiesDiv.innerHTML = recentActivities
    .map(
      (activity) => `
                  <div class="flex items-center p-2 hover:bg-gray-50 rounded">
                      <i class="fas fa-history text-purple-500 mr-2"></i>
                      <div>
                          <p class="text-sm">${activity.activity}</p>
                          <p class="text-xs text-gray-500">${new Date(
                            activity.timestamp
                          ).toLocaleString()}</p>
                      </div>
                  </div>
                `
    )
    .join("");
}

function loadSubjectSuggestions() {
  const savedSuggestions =
    JSON.parse(localStorage.getItem("subjectSuggestions")) || [];
  subjectSuggestions = new Set(savedSuggestions);
  updateSubjectSuggestions();
}

function updateSubjectSuggestions() {
  const datalist = document.getElementById("subjectSuggestions");
  datalist.innerHTML = Array.from(subjectSuggestions)
    .map((subject) => `<option value="${subject}">`)
    .join("");
  localStorage.setItem(
    "subjectSuggestions",
    JSON.stringify(Array.from(subjectSuggestions))
  );
}

function convertScoreTo4Scale(score) {
  if (score >= 8.5) return 4.0;
  if (score >= 8.0) return 3.5;
  if (score >= 7.0) return 3.0;
  if (score >= 6.5) return 2.5;
  if (score >= 5.5) return 2.0;
  if (score >= 5.0) return 1.5;
  if (score >= 4.0) return 1.0;
  return 0.0;
}

function convertToLetterGrade(score4) {
  if (score4 === 4.0) return "A";
  if (score4 === 3.5) return "B+";
  if (score4 === 3.0) return "B";
  if (score4 === 2.5) return "C+";
  if (score4 === 2.0) return "C";
  if (score4 === 1.5) return "D+";
  if (score4 === 1.0) return "D";
  return "F";
}

function gradeToLetter(grade) {
  const gradeMap = {
    4: "A",
    3.5: "B+",
    3: "B",
    2.5: "C+",
    2: "C",
    1.5: "D+",
    1: "D",
    0: "F",
  };
  return gradeMap[grade] || "N/A";
}

function getGradeClassification(gpa) {
  if (gpa >= 3.6) return "Xuất sắc";
  if (gpa >= 3.2) return "Giỏi";
  if (gpa >= 2.5) return "Khá";
  if (gpa >= 2.0) return "Trung bình";
  return "Yếu";
}

function getGpaColorClass(gpa) {
  if (gpa >= 3.6) return "text-green-600";
  if (gpa >= 3.2) return "text-blue-600";
  if (gpa >= 2.5) return "text-yellow-600";
  if (gpa >= 2.0) return "text-orange-600";
  return "text-red-600";
}

function showStudentDetail(studentId) {
  const student = excelStudentData[studentId];
  if (!student) return;

  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  modal.id = "studentDetailModalTemp";

  // Nội dung modal
  modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">Chi tiết điểm sinh viên</h3>
            <button id="closeStudentDetailModalTemp" class="modal-close-btn text-gray-500 hover:text-gray-700">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="space-y-4">
            <p><strong>Mã SV:</strong> ${student.studentId}</p>
            <p><strong>Họ và tên:</strong> ${student.lastName} ${
    student.firstName
  }</p>
            <p><strong>Điểm trung bình hệ 4:</strong> <span class="${getGpaColorClass(
              student.averageScore4
            )}">${student.averageScore4.toFixed(2)}</span></p>
            <p><strong>Xếp loại:</strong> ${getGradeClassification(
              student.averageScore4
            )}</p>
            <h4 class="font-medium mt-4 mb-2">Chi tiết điểm môn học:</h4>
            <div class="space-y-2">
              ${excelSubjects
                .map((subject) => {
                  const score =
                    student.scores[subject] !== undefined &&
                    student.scores[subject] !== ""
                      ? student.scores[subject]
                      : "-";
                  const score4 =
                    student.scores4[subject] !== undefined
                      ? student.scores4[subject]
                      : "-";
                  const isFailed = score4 === 0;
                  return `
                    <p class="${isFailed ? "failed-subject" : ""}">
                      <span class="font-medium">${subject}:</span>
                      ${
                        score === 0
                          ? "Không đạt"
                          : score === "-"
                          ? "-"
                          : score.toFixed(1)
                      }
                      ${
                        score4 !== "-"
                          ? `(${convertToLetterGrade(score4)}${
                              isFailed ? ", Không đạt" : ""
                            })`
                          : ""
                      }
                      ${
                        excelCredits[subject]
                          ? `(${excelCredits[subject]} tín chỉ)`
                          : ""
                      }
                    </p>
                  `;
                })
                .join("")}
            </div>
            ${
              student.failedSubjects.length > 0
                ? `<p class="failed-subject mt-4"><strong>Môn không đạt:</strong> ${student.failedSubjects.join(
                    ", "
                  )}</p>`
                : ""
            }
          </div>
        </div>
      `;

  document.body.appendChild(modal);

  document
    .getElementById("closeStudentDetailModalTemp")
    .addEventListener("click", function () {
      document.body.removeChild(modal);
    });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
