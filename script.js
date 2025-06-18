// script.js

let currentChatId = null;
let apiKey = localStorage.getItem('apiKey') || "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";
let userId = localStorage.getItem('user_id');

// دالة فتح الدعم الفني
function openSupportChat() {
  if (!userId) {
    alert('الرجاء تسجيل الدخول أولاً');
    window.location.href = 'login.html';
    return;
  }

  // إنشاء محادثة دعم فني جديدة
  fetch("https://yemen-chat-version-8.onrender.com/support-chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      window.location.href = `support_chat.html?chat_id=${data.chat_id}`;
    } else {
      alert('حدث خطأ أثناء فتح الدردشة مع الدعم الفني');
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  checkAPIStatus();
  initEmojis();
  loadProfile();
  
  // تحميل الدردشات عند بدء التشغيل
  if (userId) {
    loadChats();
  }
  
  // إظهار زر لوحة التحكم للإدمن فقط
  const isAdmin = localStorage.getItem('is_admin') === 'true';
  if(isAdmin) {
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
      adminBtn.style.display = 'block';
      adminBtn.addEventListener('click', () => {
        window.location.href = 'admin_panel.html';
      });
    }
  }

  // إغلاق القائمة عند النقر خارجها
  const overlay = document.getElementById("sidebar-overlay");
  if (overlay) {
    overlay.addEventListener("click", toggleSidebar);
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("visible");
    overlay.style.display = sidebar.classList.contains("visible") ? "block" : "none";
  }
}

function togglePlusMenu() {
  const dropdown = document.getElementById("dropdown");
  dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}

function toggleEmojiPicker() {
  const emojiContainer = document.getElementById("emoji-container");
  emojiContainer.style.display = emojiContainer.style.display === "block" ? "none" : "block";
}

function initEmojis() {
  const picker = document.getElementById('emoji-picker');
  if (picker) {
    picker.addEventListener('emoji-click', event => {
      document.getElementById("prompt").value += event.detail.unicode;
      document.getElementById("emoji-container").style.display = "none";
    });
  }
}

function openSettings() {
  document.getElementById('settings-modal').style.display = 'flex';
  document.getElementById('api-key').value = apiKey;
  showProfileSettings();
}

function closeSettings() {
  document.getElementById('settings-modal').style.display = 'none';
}

function showProfileSettings() {
  document.getElementById('profile-settings').style.display = 'block';
  document.getElementById('api-settings').style.display = 'none';
}

function showApiSettings() {
  document.getElementById('profile-settings').style.display = 'none';
  document.getElementById('api-settings').style.display = 'block';
}

function loadProfile() {
  document.getElementById("full-name").value = localStorage.getItem("fullName") || "";
  document.getElementById("username").value = localStorage.getItem("username") || "";
  document.getElementById("email").value = localStorage.getItem("email") || "";
  const img = localStorage.getItem("profileImage");
  if (img) {
    const profileImage = document.getElementById("profile-image");
    profileImage.src = img;
    profileImage.style.display = 'block';
  }
}

function copyCode(button) {
  const code = button.closest('.code-header').nextElementSibling.textContent;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.innerHTML;
    button.innerHTML = 'تم النسخ!';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  });
}

function copyMessage(button) {
  const msg = button.closest('.message').querySelector('.message-content').innerText;
  navigator.clipboard.writeText(msg).then(() => {
    const original = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => button.innerHTML = '<i class="fas fa-copy"></i>', 2000);
  });
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMessageContent(content) {
  if (/```[\s\S]*?```/.test(content)) {
    const codeBlocks = content.match(/```(\w*)\n([\s\S]*?)```/g);
    let formattedContent = content;

    codeBlocks.forEach((block) => {
      const langMatch = block.match(/```(\w*)\n/);
      const lang = langMatch ? langMatch[1] : 'text';
      const codeText = block.replace(/```(\w*)\n/, '').replace(/```$/, '');

      const codeBlock = `
        <div style="position: relative; margin: 15px 0;">
          <div class="code-header">
            <span class="language-tag">${lang}</span>
            <button class="copy-btn" onclick="copyCode(this)">
              <i class="fas fa-copy"></i> نسخ الكود
            </button>
          </div>
          <pre><code class="language-${lang}">${escapeHtml(codeText)}</code></pre>
        </div>
      `;

      formattedContent = formattedContent.replace(block, codeBlock);
    });

    return formattedContent;
  }

  return content.replace(/\n/g, '<br>');
}

// دالة تحميل الدردشات من قاعدة البيانات
function loadChats() {
  fetch(`https://yemen-chat-version-8.onrender.com/chats?user_id=${userId}`)
    .then(res => res.json())
    .then(chats => {
      const chatList = document.getElementById("chat-list");
      chatList.innerHTML = "";
      
      chats.forEach(chat => {
        const li = document.createElement("li");
        li.className = chat.id === currentChatId ? "active" : "";
        li.innerHTML = `
          <div class="chat-info">
            <i class="fas fa-comment chat-icon"></i>
            <span>${chat.title}</span>
          </div>
          <button class="delete-chat" onclick="deleteChat(event, '${chat.id}')">
            <i class="fas fa-trash"></i>
          </button>
        `;
        li.addEventListener("click", () => {
          currentChatId = chat.id;
          loadMessages(chat.id);
          updateChatList();
        });
        chatList.appendChild(li);
      });
      
      // تحديد الدردشة الأولى تلقائياً إذا لم يكن هناك دردشة محددة
      if (chats.length > 0 && !currentChatId) {
        currentChatId = chats[0].id;
        loadMessages(chats[0].id);
        updateChatList();
      }
    });
}

// دالة تحميل الرسائل لدردشة محددة
function loadMessages(chatId) {
  fetch(`https://yemen-chat-version-8.onrender.com/chats/${chatId}/messages`)
    .then(res => res.json())
    .then(messages => {
      const chatWindow = document.getElementById("chat-window");
      chatWindow.innerHTML = "";
      
      messages.forEach(msg => {
        const div = document.createElement("div");
        div.className = `message ${msg.role}`;
        div.innerHTML = `
          <div class="message-header">
            <div class="message-sender">
              ${msg.role === 'user' ? 'You' : 'Taiz Soft'}
            </div>
            <div class="message-time">${formatTime(msg.timestamp)}</div>
          </div>
          <div class="message-content">${formatMessageContent(msg.content)}</div>`;
        chatWindow.appendChild(div);
      });
      
      chatWindow.scrollTop = chatWindow.scrollHeight;
      if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    });
}

function sendMessage(customPrompt = null) {
  const input = document.getElementById("prompt");
  const prompt = customPrompt || input.value.trim();
  if (!prompt || !currentChatId) return;
  input.value = "";

  // إضافة الرسالة إلى قاعدة البيانات
  fetch(`https://yemen-chat-version-8.onrender.com/chats/${currentChatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "user",
      content: prompt
    })
  })
  .then(() => {
    loadMessages(currentChatId);
    
    const typingMsg = { role: "assistant", content: "جارٍ الكتابة...", timestamp: new Date() };
    const chatWindow = document.getElementById("chat-window");
    const div = document.createElement("div");
    div.className = "message bot";
    div.innerHTML = `
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // جلب رد المساعد
    getAssistantResponse(prompt);
  });
}

function getAssistantResponse(prompt) {
  fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-Title": "AI Chat"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000
    }),
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw new Error(JSON.stringify(err)) });
    }
    return response.json();
  })
  .then(data => {
    const content = data.choices?.[0]?.message?.content || "لم أتمكن من إيجاد رد مناسب.";
    
    // حفظ رد المساعد في قاعدة البيانات
    fetch(`https://yemen-chat-version-8.onrender.com/chats/${currentChatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "assistant",
        content: content
      })
    })
    .then(() => {
      loadMessages(currentChatId);
      
      // تحديث عنوان الدردشة إذا كان جديداً
      const chatTitle = document.querySelector(`li[data-id="${currentChatId}"] span`);
      if (chatTitle && chatTitle.textContent === "محادثة جديدة") {
        const newTitle = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        chatTitle.textContent = newTitle;
        updateChatTitle(currentChatId, newTitle);
      }
    });
  })
  .catch(error => {
    console.error("Error:", error);
    let errorMsg = "حدث خطأ أثناء جلب الرد. يرجى المحاولة مرة أخرى.";
    try {
      const errorData = JSON.parse(error.message);
      if (errorData.error && errorData.error.message) {
        errorMsg = errorData.error.message;
      }
    } catch (e) {
      if (error.message.includes("401")) {
        errorMsg = "مفتاح API غير صحيح أو منتهي الصلاحية";
      } else if (error.message.includes("402")) {
        errorMsg = "انتهى رصيدك في OpenRouter";
      } else if (error.message.includes("404")) {
        errorMsg = "نقطة النهاية غير صحيحة";
      }
    }
    
    // حفظ خطأ المساعد في قاعدة البيانات
    fetch(`https://yemen-chat-version-8.onrender.com/chats/${currentChatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: "assistant",
        content: errorMsg
      })
    })
    .then(() => {
      loadMessages(currentChatId);
    });
  });
}

function startNewChat() {
  fetch("https://yemen-chat-version-8.onrender.com/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      title: "محادثة جديدة"
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      currentChatId = data.chat_id;
      loadChats();
      
      const chatWindow = document.getElementById("chat-window");
      chatWindow.innerHTML = document.querySelector('.welcome-message').outerHTML;
    }
  });
}

function deleteChat(event, id) {
  event.stopPropagation();
  
  if (confirm('هل أنت متأكد من رغبتك في حذف هذه المحادثة؟')) {
    fetch(`https://yemen-chat-version-8.onrender.com/chats/${id}`, {
      method: "DELETE"
    })
    .then(() => {
      if (currentChatId === id) {
        currentChatId = null;
      }
      loadChats();
    });
  }
}

function updateChatTitle(chatId, title) {
  fetch(`https://yemen-chat-version-8.onrender.com/chats/${chatId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title })
  });
}

function uploadFile(type) {
  alert(`تم اختيار رفع ملف من نوع: ${type}. هذه ميزة تجريبية، سيتم تنفيذها بالكامل في المستقبل.`);
  togglePlusMenu();
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function checkAPIStatus() {
  fetch("https://openrouter.ai/api/v1/models")
    .then(response => {
      if (!response.ok) {
        console.error("مشكلة في اتصال OpenRouter API");
      } else {
        console.log("اتصال API يعمل بشكل صحيح");
      }
    })
    .catch(error => console.error("فشل الاتصال بـ OpenRouter:", error));
}

function logout() {
  localStorage.removeItem('is_admin');
  localStorage.removeItem('user_id');
  localStorage.removeItem('fullName');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  localStorage.removeItem('profileImage');
  window.location.href = 'login.html';
}