(() => {
  const chatLog = document.getElementById("chatLog");
  const chatForm = document.getElementById("chatForm");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const resetBtn = document.getElementById("resetBtn");
  const waveform = document.getElementById("waveform");
  const statusDot = document.getElementById("statusDot");
  const statusLabel = document.getElementById("statusLabel");

  const setStatus = (state) => {
    statusDot.classList.remove("thinking", "offline");
    if (state === "thinking") {
      statusDot.classList.add("thinking");
      statusLabel.textContent = "Thinking";
    } else if (state === "offline") {
      statusDot.classList.add("offline");
      statusLabel.textContent = "Offline";
    } else {
      statusLabel.textContent = "Online";
    }
  };

  const scrollToBottom = () => {
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const createMessage = ({ role, text, isError = false, isTyping = false }) => {
    const wrapper = document.createElement("div");
    wrapper.className = `msg ${role}`;

    const avatar = document.createElement("div");
    avatar.className = `avatar ${role === "assistant" ? "assistant-avatar" : "user-avatar"}`;
    if (role === "assistant") {
      const ring = document.createElement("span");
      ring.className = "avatar-ring";
      avatar.appendChild(ring);
    } else {
      avatar.textContent = "YOU";
    }

    const bubble = document.createElement("div");
    bubble.className = `bubble${isError ? " error" : ""}`;

    if (isTyping) {
      bubble.innerHTML =
        '<div class="typing-dots"><span></span><span></span><span></span></div>';
    } else {
      const p = document.createElement("p");
      p.textContent = text;
      const time = document.createElement("span");
      time.className = "timestamp";
      time.textContent = formatTime();
      bubble.appendChild(p);
      bubble.appendChild(time);
    }

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatLog.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  };

  const autoResize = () => {
    messageInput.style.height = "auto";
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 160)}px`;
  };

  messageInput.addEventListener("input", autoResize);

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  const sendMessage = async (text) => {
    sendBtn.disabled = true;
    waveform.classList.add("active");
    setStatus("thinking");

    const typingBubble = createMessage({ role: "assistant", isTyping: true });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      typingBubble.remove();

      if (!res.ok) {
        createMessage({
          role: "assistant",
          text: data.error || "Something went wrong. Please try again.",
          isError: true,
        });
        setStatus("offline");
      } else {
        createMessage({ role: "assistant", text: data.reply });
        setStatus("online");
      }
    } catch (err) {
      typingBubble.remove();
      createMessage({
        role: "assistant",
        text: "Connection lost. Check the server and try again.",
        isError: true,
      });
      setStatus("offline");
    } finally {
      sendBtn.disabled = false;
      waveform.classList.remove("active");
    }
  };

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    createMessage({ role: "user", text });
    messageInput.value = "";
    autoResize();
    sendMessage(text);
  });

  resetBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/reset", { method: "POST" });
    } catch (err) {
      /* non-fatal */
    }
    chatLog.innerHTML = "";
    createMessage({ role: "assistant", text: "New session started. How can I help?" });
    setStatus("online");
    messageInput.focus();
  });

  window.addEventListener("load", () => messageInput.focus());
})();
