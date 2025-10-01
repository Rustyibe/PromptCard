// AI Prompt Manager - Popup Script

// DOM Elements
const categoriesList = document.getElementById("categoriesList");
const promptsList = document.getElementById("promptsList");
const searchInput = document.getElementById("searchInput");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const addPromptBtn = document.getElementById("addPromptBtn");
const promptEditorModal = document.getElementById("promptEditorModal");
const promptEditorTitle = document.getElementById("promptEditorTitle");
const promptEditorTextarea = document.getElementById("promptEditorTextarea");
const promptEditorClose = document.getElementById("promptEditorClose");
const promptEditorCancel = document.getElementById("promptEditorCancel");
const promptEditorSave = document.getElementById("promptEditorSave");
const promptLength = document.getElementById("promptLength");
const promptEditorInput = document.getElementById("promptEditorInput");
const copyAllBtn = document.getElementById("copyAllBtn");
const selectedCategoryTitle = document.getElementById("selectedCategoryTitle");
const categoriesView = document.getElementById("categoriesView");
const promptsView = document.getElementById("promptsView");
const backBtn = document.getElementById("backBtn");
const pageTitle = document.getElementById("pageTitle");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");

// App state
let appState = {
  categories: [],
  currentCategory: null,
  searchQuery: "",
  dragItem: null,
  filteredCategories: [], // For search results
  view: "categories", // 'categories' or 'prompts'
};

// Initialize the app
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  renderCategories();
  setupEventListeners();
  // Initially show categories view
  switchToCategoriesView();
});

// 从存储中加载数据
async function loadData() {
  const result = await chrome.storage.local.get(["categories"]);
  if (result.categories) {
    appState.categories = result.categories;
  } else {
    // 如果没有数据则使用示例数据初始化
    appState.categories = [
      {
        id: "1",
        name: "创意写作",
        prompts: [
          { id: "1-1", content: "基于以下主题生成一个创意故事想法: [THEME]" },
          {
            id: "1-2",
            content: "为具有以下特征的主角开发详细的角色档案: [TRAITS]",
          },
        ],
      },
      {
        id: "2",
        name: "编程辅助",
        prompts: [
          { id: "2-1", content: "用简单的话解释以下代码: [CODE]" },
          { id: "2-2", content: "识别并修复此代码中的错误: [CODE]" },
        ],
      },
    ];
    await saveData();
  }
}

// Save data to storage
async function saveData() {
  await chrome.storage.local.set({
    categories: appState.categories,
  });
}

// Render categories list
function renderCategories() {
  categoriesList.innerHTML = "";

  // Determine which categories to render based on search state
  const categoriesToRender =
    appState.filteredCategories.length > 0
      ? appState.filteredCategories
      : appState.categories;

  categoriesToRender.forEach((category) => {
    const li = document.createElement("li");
    li.dataset.id = category.id;

    if (
      appState.currentCategory &&
      category.id === appState.currentCategory.id
    ) {
      li.classList.add("active");
    }

    // Create category name element
    const categoryName = document.createElement("div");
    categoryName.className = "category-name";
    categoryName.textContent = category.name;

    // Create category count element
    const categoryCount = document.createElement("div");
    categoryCount.className = "category-count";
    categoryCount.textContent = `${category.prompts.length} 条提示`;

    const categoryActions = document.createElement("div");
    categoryActions.className = "category-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = "<span>✏️</span> 编辑";
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      editCategory(category.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "<span>🗑</span> 删除";
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteCategory(category.id);
    });

    categoryActions.appendChild(editBtn);
    categoryActions.appendChild(deleteBtn);

    li.appendChild(categoryName);
    li.appendChild(categoryCount);
    li.appendChild(categoryActions);

    li.addEventListener("click", () => selectCategory(category));
    categoriesList.appendChild(li);
  });
}

// 选择主题并渲染其提示词
function selectCategory(category) {
  appState.currentCategory = category;
  // 选择主题时清除搜索
  appState.searchQuery = "";
  searchInput.value = "";
  appState.filteredCategories = [];
  renderCategories();
  selectedCategoryTitle.textContent = category.name;
  renderPrompts();

  // Switch to prompts view
  switchToPromptsView();
}

// 渲染所选主题的提示词列表
function renderPrompts() {
  // 如果在搜索模式下，显示过滤结果中的提示词
  if (appState.searchQuery && appState.filteredCategories.length > 0) {
    promptsList.innerHTML = "";

    // 合并所有匹配类别的提示词
    appState.filteredCategories.forEach((category) => {
      // 为每个类别添加标题
      const categoryHeader = document.createElement("div");
      categoryHeader.className = "category-header";
      categoryHeader.textContent = category.name;
      promptsList.appendChild(categoryHeader);

      category.prompts.forEach((prompt, index) => {
        const li = document.createElement("li");
        li.classList.add("sortable-item");
        li.dataset.id = prompt.id;
        li.dataset.index = index;
        li.dataset.categoryId = category.id; // 了解此提示词属于哪个类别

        const contentDiv = document.createElement("div");
        contentDiv.className = "prompt-content";
        contentDiv.textContent =
          prompt.content.substring(0, 120) +
          (prompt.content.length > 120 ? "..." : "");
        contentDiv.title = prompt.content; // 提示内容的工具提示

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.innerHTML = "<span>📋</span> 复制";
        copyBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          copyPrompt(prompt.content);
        });

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.innerHTML = "<span>✏️</span> 编辑";
        editBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          editPrompt(category.id, prompt.id, prompt.content);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = "<span>🗑</span> 删除";
        deleteBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          deletePrompt(category.id, prompt.id);
        });

        li.appendChild(contentDiv);

        const promptActions = document.createElement("div");
        promptActions.className = "prompt-actions";
        promptActions.appendChild(copyBtn);
        promptActions.appendChild(editBtn);
        promptActions.appendChild(deleteBtn);

        li.appendChild(promptActions);

        // 跳过搜索结果的拖动事件，因为不能跨类别重排序
        promptsList.appendChild(li);
      });
    });

    return;
  }

  // 正常主题视图
  if (!appState.currentCategory) {
    promptsList.innerHTML =
      '<div class="no-selection">选择一个主题以查看提示词</div>';
    return;
  }

  promptsList.innerHTML = "";

  appState.currentCategory.prompts.forEach((prompt, index) => {
    const li = document.createElement("li");
    li.classList.add("sortable-item");
    li.dataset.id = prompt.id;
    li.dataset.index = index;

    const contentDiv = document.createElement("div");
    contentDiv.className = "prompt-content";
    contentDiv.textContent =
      prompt.content.substring(0, 120) +
      (prompt.content.length > 120 ? "..." : "");
    contentDiv.title = prompt.content; // 提示内容的工具提示

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.innerHTML = "<span>📋</span> 复制";
    copyBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      copyPrompt(prompt.content);
    });

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = "<span>✏️</span> 编辑";
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      editPrompt(appState.currentCategory.id, prompt.id, prompt.content);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "<span>🗑</span> 删除";
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deletePrompt(appState.currentCategory.id, prompt.id);
    });

    li.appendChild(contentDiv);

    const promptActions = document.createElement("div");
    promptActions.className = "prompt-actions";
    promptActions.appendChild(copyBtn);
    promptActions.appendChild(editBtn);
    promptActions.appendChild(deleteBtn);

    li.appendChild(promptActions);

    // 添加拖动事件以进行排序
    li.draggable = true;
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("dragenter", handleDragEnter);
    li.addEventListener("dragleave", handleDragLeave);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    promptsList.appendChild(li);
  });
}

// Drag and drop functions for reordering prompts
function handleDragStart(e) {
  appState.dragItem = this;
  this.style.opacity = "0.5";
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.id);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleDragEnter(e) {
  this.classList.add("drag-over");
}

function handleDragLeave(e) {
  this.classList.remove("drag-over");
}

function handleDrop(e) {
  e.stopPropagation();
  this.classList.remove("drag-over");

  if (appState.dragItem !== this) {
    // Reorder prompts in the array
    const dragId = appState.dragItem.dataset.id;
    const dropId = this.dataset.id;

    const dragIndex = Array.from(promptsList.children).indexOf(
      appState.dragItem
    );
    const dropIndex = Array.from(promptsList.children).indexOf(this);

    if (dragIndex < dropIndex) {
      // Moving down
      appState.currentCategory.prompts.splice(
        dropIndex + 1,
        0,
        appState.currentCategory.prompts.splice(dragIndex, 1)[0]
      );
    } else {
      // Moving up
      appState.currentCategory.prompts.splice(
        dropIndex,
        0,
        appState.currentCategory.prompts.splice(dragIndex, 1)[0]
      );
    }

    saveData();
    renderPrompts();
  }

  return false;
}

function handleDragEnd(e) {
  this.style.opacity = "1";
  appState.dragItem = null;
}

// 复制提示词到剪贴板
function copyPrompt(content) {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      showCopyFeedback();
    })
    .catch((err) => {
      console.error("复制提示词失败: ", err);
      // 如果剪贴板API失败则使用备用方法
      const textArea = document.createElement("textarea");
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showCopyFeedback();
    });
}

// 显示复制成功的视觉反馈
function showCopyFeedback() {
  // 移除任何现有的反馈元素
  const existingFeedback = document.querySelector(".copy-feedback");
  if (existingFeedback) {
    existingFeedback.remove();
  }

  // 创建反馈元素
  const feedback = document.createElement("div");
  feedback.className = "copy-feedback";
  feedback.textContent = "已复制到剪贴板！";

  document.body.appendChild(feedback);

  // 动画完成后移除元素
  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

// Copy all prompts in current category
function copyAllPrompts() {
  if (!appState.currentCategory) return;

  const allContent = appState.currentCategory.prompts
    .map((p) => p.content)
    .join("\n\n");

  copyPrompt(allContent);
}

async function deleteCategory(categoryId) {
  const categoryIndex = appState.categories.findIndex(
    (category) => category.id === categoryId
  );
  if (categoryIndex === -1) {
    return;
  }

  const confirmed = confirm("确定要删除该主题及其所有提示词吗？");
  if (!confirmed) {
    return;
  }

  const isCurrentCategory =
    appState.currentCategory && appState.currentCategory.id === categoryId;

  appState.categories.splice(categoryIndex, 1);

  if (isCurrentCategory) {
    appState.currentCategory = null;
    selectedCategoryTitle.textContent = "选择一个主题";
  }

  await saveData();

  if (appState.searchQuery) {
    performSearch();
  } else {
    renderCategories();
    renderPrompts();
  }

  if (isCurrentCategory && appState.view === "prompts") {
    switchToCategoriesView();
  }
}

// 编辑主题名称
async function editCategory(categoryId) {
  const category = appState.categories.find((item) => item.id === categoryId);
  if (!category) {
    return;
  }

  openPromptEditor({
    title: "编辑主题",
    multiline: false,
    initial: category.name,
    placeholder: "输入主题名称...",
    onSave: async (newCategoryName) => {
      const name = (newCategoryName || "").trim();
      if (!name || name === category.name) return;
      category.name = name;
      await saveData();
      renderCategories();
      if (
        appState.currentCategory &&
        appState.currentCategory.id === categoryId
      ) {
        appState.currentCategory.name = name;
        selectedCategoryTitle.textContent = name;
        if (appState.view === "prompts") pageTitle.textContent = name;
      }
    },
  });
}

// 编辑提示词内容
async function editPrompt(categoryId, promptId, currentContent) {
  const category = appState.categories.find((item) => item.id === categoryId);
  if (!category) return;
  const promptIndex = category.prompts.findIndex(
    (item) => item.id === promptId
  );
  if (promptIndex === -1) return;

  openPromptEditor({
    title: "编辑提示词",
    initial: currentContent,
    onSave: async (newPromptContent) => {
      category.prompts[promptIndex].content = newPromptContent;
      if (
        appState.currentCategory &&
        appState.currentCategory.id === categoryId
      ) {
        appState.currentCategory.prompts[promptIndex].content =
          newPromptContent;
      }
      await saveData();
      renderPrompts();
      renderCategories();
    },
  });
}

// 添加新主题
async function addNewCategory() {
  openPromptEditor({
    title: "新建主题",
    multiline: false,
    initial: "",
    placeholder: "输入主题名称...",
    onSave: async (categoryName) => {
      const name = (categoryName || "").trim();
      if (!name) return;
      const newCategory = {
        id: Date.now().toString(),
        name,
        prompts: [],
      };
      appState.categories.push(newCategory);
      await saveData();
      renderCategories();
    },
  });
}

// 向当前主题添加新提示词
async function addNewPrompt() {
  if (!appState.currentCategory) {
    alert("请先选择一个主题");
    return;
  }

  openPromptEditor({
    title: "新建提示词",
    initial: "",
    onSave: async (content) => {
      if (!content || !content.trim()) return;
      const newPrompt = {
        id: `${appState.currentCategory.id}-${Date.now()}`,
        content: content.trim(),
      };
      appState.currentCategory.prompts.push(newPrompt);
      await saveData();
      renderPrompts();
    },
  });
}

async function deletePrompt(categoryId, promptId) {
  const category = appState.categories.find((item) => item.id === categoryId);
  if (!category) {
    return;
  }

  const promptIndex = category.prompts.findIndex(
    (item) => item.id === promptId
  );
  if (promptIndex === -1) {
    return;
  }

  const confirmed = confirm("确定要删除该提示词吗？");
  if (!confirmed) {
    return;
  }

  category.prompts.splice(promptIndex, 1);

  if (appState.currentCategory && appState.currentCategory.id === categoryId) {
    appState.currentCategory = {
      ...appState.currentCategory,
      prompts: [...category.prompts],
    };
    const currentCategoryIndex = appState.categories.findIndex(
      (item) => item.id === categoryId
    );
    if (currentCategoryIndex !== -1) {
      appState.currentCategory = appState.categories[currentCategoryIndex];
    }
  }

  await saveData();

  if (appState.searchQuery) {
    performSearch();
  } else {
    renderPrompts();
    renderCategories();
  }
}

// 跨主题和提示词执行搜索
function performSearch() {
  if (!appState.searchQuery) {
    appState.filteredCategories = [];
    renderCategories();
    if (appState.currentCategory) {
      renderPrompts();
    }
    return;
  }

  const query = appState.searchQuery;
  appState.filteredCategories = [];

  // 在所有主题中搜索
  appState.categories.forEach((category) => {
    // 检查主题名称是否匹配
    const categoryMatches = category.name.toLowerCase().includes(query);

    // 检查此类别中的任何提示词是否匹配
    const matchingPrompts = category.prompts.filter((prompt) =>
      prompt.content.toLowerCase().includes(query)
    );

    if (categoryMatches || matchingPrompts.length > 0) {
      // 添加带有过滤提示词的主题
      appState.filteredCategories.push({
        ...category,
        prompts:
          matchingPrompts.length > 0 ? matchingPrompts : category.prompts,
      });
    }
  });

  // 如果当前在提示词视图中进行搜索，则切换回类别视图
  if (appState.view === "prompts") {
    switchToCategoriesView();
  }

  renderCategories();
  // 在搜索模式下重置当前主题
  if (appState.searchQuery) {
    appState.currentCategory = null;
    selectedCategoryTitle.textContent = "搜索结果";
    renderPrompts();
  }
}

// Switch to prompts view
function switchToPromptsView() {
  categoriesView.style.display = "none";
  promptsView.style.display = "block";
  backBtn.style.display = "block";
  pageTitle.textContent = appState.currentCategory.name;
  appState.view = "prompts";
}

function openPromptEditor({
  title,
  initial,
  onSave,
  multiline = true,
  placeholder,
}) {
  promptEditorTitle.textContent = title;
  const showTextarea = !!multiline;
  promptEditorTextarea.style.display = showTextarea ? "block" : "none";
  promptEditorInput.style.display = showTextarea ? "none" : "block";

  if (showTextarea) {
    promptEditorTextarea.value = initial || "";
    if (placeholder) promptEditorTextarea.placeholder = placeholder;
  } else {
    promptEditorInput.value = initial || "";
    if (placeholder) promptEditorInput.placeholder = placeholder;
  }

  updatePromptLength();
  promptEditorModal.style.display = "flex";
  setTimeout(
    () =>
      showTextarea ? promptEditorTextarea.focus() : promptEditorInput.focus(),
    0
  );
  openPromptEditor._onSave = onSave;

  promptEditorTextarea.addEventListener("input", updatePromptLength);
  promptEditorInput.addEventListener("input", updatePromptLength);
}

function updatePromptLength() {
  const el =
    promptEditorTextarea.style.display !== "none"
      ? promptEditorTextarea
      : promptEditorInput;
  promptLength.textContent = `${(el.value || "").length} 字符`;
}

function submitPromptEditor() {
  const el =
    promptEditorTextarea.style.display !== "none"
      ? promptEditorTextarea
      : promptEditorInput;
  const value = el.value;
  if (openPromptEditor._onSave) {
    openPromptEditor._onSave(value);
  }
  closePromptEditor();
}

function closePromptEditor() {
  promptEditorModal.style.display = "none";
  promptEditorTextarea.value = "";
  promptEditorInput.value = "";
  promptLength.textContent = "0 字符";
  promptEditorTextarea.removeEventListener("input", updatePromptLength);
  promptEditorInput.removeEventListener("input", updatePromptLength);
}

// Switch to categories view
function switchToCategoriesView() {
  promptsView.style.display = "none";
  categoriesView.style.display = "block";
  backBtn.style.display = "none";
  pageTitle.textContent = "AI 提示词管理器";
  appState.view = "categories";
}

// Setup event listeners
function setupEventListeners() {
  addCategoryBtn.addEventListener("click", addNewCategory);
  addPromptBtn.addEventListener("click", addNewPrompt);
  copyAllBtn.addEventListener("click", copyAllPrompts);
  backBtn.addEventListener("click", switchToCategoriesView);
  importBtn.addEventListener("click", importData);
  exportBtn.addEventListener("click", exportData);

  // Search functionality
  searchInput.addEventListener("input", (e) => {
    appState.searchQuery = e.target.value.toLowerCase();
    if (appState.searchQuery) {
      performSearch();
    } else {
      // Show all categories when search is cleared
      appState.filteredCategories = [];
      renderCategories();
      if (appState.currentCategory) {
        renderPrompts();
      }
    }
  });

  promptEditorClose.addEventListener("click", closePromptEditor);
  promptEditorCancel.addEventListener("click", closePromptEditor);
  promptEditorSave.addEventListener("click", () => submitPromptEditor());

  document.addEventListener("keydown", (e) => {
    if (promptEditorModal.style.display === "none") return;
    if (e.key === "Escape") closePromptEditor();
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submitPromptEditor();
  });
}

// Import data from a JSON file
async function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        // Validate the imported data structure
        if (!importedData || !Array.isArray(importedData.categories)) {
          alert("导入的数据格式不正确！");
          return;
        }

        // Confirm before importing
        const confirmImport = confirm(
          `确定要导入 ${importedData.categories.length} 个主题吗？\n注意：这将会覆盖当前的所有数据。`
        );
        if (!confirmImport) return;

        // Replace the current categories with imported data
        appState.categories = importedData.categories.map((category) => ({
          ...category,
          // Ensure each prompt has an ID in case it's missing
          prompts: category.prompts.map((prompt) => ({
            id: prompt.id || `${category.id}-${Date.now()}`,
            content: prompt.content,
          })),
        }));

        await saveData();
        renderCategories();

        alert("数据导入成功！");
      } catch (error) {
        console.error("导入数据时出错:", error);
        alert("导入失败，请确保选择的是有效的JSON文件！");
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

// Export data to a JSON file
async function exportData() {
  try {
    // Prepare data to export
    const dataToExport = {
      categories: appState.categories,
      exportedAt: new Date().toISOString(),
    };

    // Create a Blob with the data
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-prompts-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    // Trigger download
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("数据导出成功！");
  } catch (error) {
    console.error("导出数据时出错:", error);
    alert("导出失败！");
  }
}
