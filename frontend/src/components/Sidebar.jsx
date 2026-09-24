
import { useEffect, useRef, useState } from "react";
import "./Sidebar.css";

function Sidebar({
  onNewChat,
  onStartTemporaryChat,
  onExitTemporaryChat,
  onClearMemory,
  onClearChatMemory,
  onDeleteChat,
  onRenameChat,
  onLogout,
  user,
  chatHistory,
  currentChatId,
  onSelectChat,
  isLoadingChats,
  isTemporaryChat,
}) {
  // ========================================
  // CHAT DATA
  // ========================================

  const chats = Array.isArray(chatHistory) ? chatHistory : [];

  // ========================================
  // MOBILE SIDEBAR STATE
  // ========================================

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);

  // ========================================
  // SEARCH STATE
  // ========================================

  const [searchQuery, setSearchQuery] = useState("");

  // ========================================
  // RENAME STATE
  // ========================================

  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  // ========================================
  // FILTER PERSISTENT CHATS
  // ========================================

  const persistentChats = chats.filter(
    (chat) => chat?.temporary !== true
  );

  // ========================================
  // FILTER CHAT HISTORY BY SEARCH
  // ========================================

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredChats = persistentChats.filter((chat) => {
    const title = chat?.title?.trim() || "Untitled Chat";

    return title
      .toLowerCase()
      .includes(normalizedSearchQuery);
  });

  // ========================================
  // CURRENT CHAT
  // ========================================

  const currentChat = chats.find(
    (chat) => chat?.id === currentChatId
  );

  // ========================================
  // CURRENT MEMORY STATUS
  // ========================================

  const currentMemoryActive =
    currentChat?.memory_active !== false;

  // ========================================
  // MOBILE SIDEBAR HELPERS
  // ========================================

  const openMobileSidebar = () => {
    setIsMobileOpen(true);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
    setEditingChatId(null);
    setEditingTitle("");
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen((previous) => !previous);
  };

  // ========================================
  // CLOSE SIDEBAR ON ESCAPE
  // ========================================

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeMobileSidebar();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileOpen]);

  // ========================================
  // PREVENT BODY SCROLL WHEN SIDEBAR OPEN
  // ========================================

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  // ========================================
  // CLOSE MOBILE SIDEBAR WHEN SWITCHING
  // TO DESKTOP
  // ========================================

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ========================================
  // TOUCH / SWIPE SUPPORT
  // ========================================

  const handleTouchStart = (event) => {
    if (!isMobileOpen) {
      return;
    }

    touchStartX.current = event.touches[0].clientX;
    touchCurrentX.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event) => {
    if (!isMobileOpen || touchStartX.current === null) {
      return;
    }

    touchCurrentX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (
      !isMobileOpen ||
      touchStartX.current === null ||
      touchCurrentX.current === null
    ) {
      return;
    }

    const distance =
      touchCurrentX.current - touchStartX.current;

    // Swipe left to close
    if (distance < -70) {
      closeMobileSidebar();
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  // ========================================
  // CLEAR SEARCH
  // ========================================

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // ========================================
  // START RENAME
  // ========================================

  const handleStartRename = (event, chat) => {
    event.stopPropagation();

    const chatId = chat?.id;

    if (!chatId) {
      return;
    }

    if (chat?.temporary === true) {
      return;
    }

    setEditingChatId(chatId);

    setEditingTitle(
      chat?.title?.trim() || "Untitled Chat"
    );
  };

  // ========================================
  // CANCEL RENAME
  // ========================================

  const handleCancelRename = (event) => {
    event?.stopPropagation();

    setEditingChatId(null);
    setEditingTitle("");
  };

  // ========================================
  // SAVE RENAME
  // ========================================

  const handleSaveRename = async (event, chat) => {
    event.preventDefault();
    event.stopPropagation();

    const chatId = chat?.id;
    const newTitle = editingTitle.trim();

    if (!chatId || !newTitle) {
      return;
    }

    if (chat?.temporary === true) {
      handleCancelRename(event);
      return;
    }

    const oldTitle =
      chat?.title?.trim() || "Untitled Chat";

    if (newTitle === oldTitle) {
      handleCancelRename(event);
      return;
    }

    if (typeof onRenameChat !== "function") {
      console.error(
        "onRenameChat callback is not provided."
      );
      return;
    }

    try {
      await onRenameChat(chatId, newTitle);

      setEditingChatId(null);
      setEditingTitle("");
    } catch (error) {
      console.error(
        "Failed to rename chat:",
        error
      );
    }
  };

  // ========================================
  // RENAME KEYBOARD CONTROLS
  // ========================================

  const handleRenameKeyDown = (event, chat) => {
    if (event.key === "Enter") {
      event.preventDefault();

      handleSaveRename(event, chat);

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      handleCancelRename(event);
    }
  };

  // ========================================
  // CLEAR CHAT MEMORY
  // ========================================

  const handleClearChatMemory = (event, chat) => {
    event.stopPropagation();

    const chatId = chat?.id;

    if (!chatId) {
      return;
    }

    if (chat?.memory_active === false) {
      return;
    }

    if (typeof onClearChatMemory !== "function") {
      console.error(
        "onClearChatMemory callback is not provided."
      );
      return;
    }

    onClearChatMemory(chatId);
  };

  // ========================================
  // DELETE CHAT
  // ========================================

  const handleDeleteChat = (event, chat) => {
    event.stopPropagation();

    const chatId = chat?.id;

    if (!chatId) {
      return;
    }

    if (typeof onDeleteChat !== "function") {
      console.error(
        "onDeleteChat callback is not provided."
      );
      return;
    }

    onDeleteChat(chatId);
  };

  // ========================================
  // SELECT CHAT
  // ========================================

  const handleSelectChat = (chat) => {
    if (typeof onSelectChat !== "function") {
      console.error(
        "onSelectChat callback is not provided."
      );
      return;
    }

    if (!chat?.id) {
      return;
    }

    if (chat?.temporary === true) {
      return;
    }

    onSelectChat(chat);

    // Automatically close mobile drawer
    closeMobileSidebar();
  };

  // ========================================
  // NEW CHAT
  // ========================================

  const handleNewChat = () => {
    if (typeof onNewChat === "function") {
      onNewChat();
    }

    closeMobileSidebar();
  };

  // ========================================
  // START TEMPORARY CHAT
  // ========================================

  const handleStartTemporaryChat = () => {
    if (
      typeof onStartTemporaryChat !==
      "function"
    ) {
      console.error(
        "onStartTemporaryChat callback is not provided."
      );
      return;
    }

    setSearchQuery("");
    setEditingChatId(null);
    setEditingTitle("");

    onStartTemporaryChat();

    closeMobileSidebar();
  };

  // ========================================
  // EXIT TEMPORARY CHAT
  // ========================================

  const handleExitTemporaryChat = () => {
    if (
      typeof onExitTemporaryChat !==
      "function"
    ) {
      console.error(
        "onExitTemporaryChat callback is not provided."
      );
      return;
    }

    onExitTemporaryChat();

    closeMobileSidebar();
  };

  // ========================================
  // EXIT EDIT MODE IF CHAT DISAPPEARS
  // ========================================

  useEffect(() => {
    if (!editingChatId) {
      return;
    }

    const chatStillExists =
      persistentChats.some(
        (chat) => chat?.id === editingChatId
      );

    if (!chatStillExists) {
      setEditingChatId(null);
      setEditingTitle("");
    }
  }, [persistentChats, editingChatId]);

  // ========================================
  // RESET SIDEBAR SEARCH / RENAME STATE
  // WHEN TEMPORARY CHAT OPENS
  // ========================================

  useEffect(() => {
    if (!isTemporaryChat) {
      return;
    }

    setSearchQuery("");
    setEditingChatId(null);
    setEditingTitle("");
  }, [isTemporaryChat]);

  // ========================================
  // HISTORY COUNT
  // ========================================

  const historyCount = normalizedSearchQuery
    ? filteredChats.length
    : persistentChats.length;

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      {/* ========================================
          MOBILE MENU BUTTON
      ======================================== */}

      <button
        type="button"
        className={`mobile - sidebar - toggle ${isMobileOpen ? "open" : ""
          } `}
        onClick={toggleMobileSidebar}
        aria-label={
          isMobileOpen
            ? "Close chat sidebar"
            : "Open chat sidebar"
        }
        aria-expanded={isMobileOpen}
        title={
          isMobileOpen
            ? "Close sidebar"
            : "Open chat sidebar"
        }
      >
        <span
          className="mobile-sidebar-toggle-icon"
          aria-hidden="true"
        >
          {isMobileOpen ? "×" : "☰"}
        </span>
      </button>

      {/* ========================================
          MOBILE OVERLAY
      ======================================== */}

      <button
        type="button"
        className={`sidebar - overlay ${isMobileOpen ? "visible" : ""
          } `}
        onClick={closeMobileSidebar}
        aria-label="Close chat sidebar"
        tabIndex={isMobileOpen ? 0 : -1}
      />

      {/* ========================================
          SIDEBAR
      ======================================== */}

      <aside
        className={`sidebar ${isMobileOpen ? "mobile-open" : ""
          } `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ========================================
            SIDEBAR HEADER
        ======================================== */}

        <div className="sidebar-header">
          <div className="logo">
            <div
              className="logo-icon"
              aria-hidden="true"
            >
              ✦
            </div>

            <div>
              <h2>EchoMind</h2>

              <span>AI + Web Search</span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            className="mobile-sidebar-close"
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* ========================================
            SIDEBAR ACTIONS
        ======================================== */}

        <div className="sidebar-actions">
          {/* NEW CHAT */}

          {!isTemporaryChat && (
            <button
              type="button"
              className="new-chat-button"
              onClick={handleNewChat}
              disabled={isLoadingChats}
              title="Start a new chat"
              aria-label="Start a new chat"
            >
              <span aria-hidden="true">
                ＋
              </span>

              New Chat
            </button>
          )}

          {/* TEMPORARY CHAT */}

          {!isTemporaryChat ? (
            <button
              type="button"
              className="temporary-chat-button"
              onClick={handleStartTemporaryChat}
              disabled={isLoadingChats}
              title="Start a temporary chat"
              aria-label="Start a temporary chat"
            >
              <span aria-hidden="true">
                🕶️
              </span>

              Temporary Chat
            </button>
          ) : (
            <button
              type="button"
              className="exit-temporary-chat-button"
              onClick={handleExitTemporaryChat}
              title="Exit temporary chat"
              aria-label="Exit temporary chat"
            >
              <span aria-hidden="true">
                ✕
              </span>

              Exit Temporary Chat
            </button>
          )}
        </div>

        {/* ========================================
            TEMPORARY CHAT INFORMATION
        ======================================== */}

        {isTemporaryChat && (
          <div
            className="temporary-chat-info"
            role="status"
            aria-live="polite"
          >
            <div
              className="temporary-chat-info-icon"
              aria-hidden="true"
            >
              🕶️
            </div>

            <div className="temporary-chat-info-content">
              <strong>
                Temporary Chat
              </strong>

              <span>
                This conversation won't
                appear in your chat history.
              </span>
            </div>
          </div>
        )}

        {/* ========================================
            PERSISTENT CHAT HISTORY
        ======================================== */}

        {!isTemporaryChat && (
          <div className="history-section">
            {/* HISTORY HEADER */}

            <div className="history-header">
              <span>
                Recent Chats
              </span>

              <span
                className="history-count"
                aria-label={`${historyCount} chats`}
              >
                {historyCount}
              </span>
            </div>

            {/* SEARCH BOX */}

            {!isLoadingChats &&
              persistentChats.length > 0 && (
                <div className="history-search">
                  <span
                    className="history-search-icon"
                    aria-hidden="true"
                  >
                    🔍
                  </span>

                  <input
                    type="text"
                    className="history-search-input"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search chats..."
                    aria-label="Search chat history"
                    autoComplete="off"
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      className="history-search-clear"
                      onClick={
                        handleClearSearch
                      }
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

            {/* HISTORY LIST */}

            <div className="history-list">
              {/* LOADING STATE */}

              {isLoadingChats ? (
                <div className="empty-history">
                  <span aria-hidden="true">
                    ⏳
                  </span>

                  <p>
                    Loading chats...
                  </p>

                  <small>
                    Fetching your conversations
                  </small>
                </div>
              ) : persistentChats.length ===
                0 ? (
                /* EMPTY HISTORY */

                <div className="empty-history">
                  <span aria-hidden="true">
                    💬
                  </span>

                  <p>
                    No conversations yet
                  </p>

                  <small>
                    Your chats will appear here
                  </small>
                </div>
              ) : filteredChats.length ===
                0 ? (
                /* NO SEARCH RESULTS */

                <div className="search-empty">
                  <span
                    className="search-empty-icon"
                    aria-hidden="true"
                  >
                    🔍
                  </span>

                  <p>
                    No chats found
                  </p>

                  <small>
                    Try a different search term
                  </small>
                </div>
              ) : (
                /* CHAT LIST */

                filteredChats.map((chat) => {
                  const chatId = chat?.id;

                  const chatTitle =
                    chat?.title?.trim() ||
                    "Untitled Chat";

                  const isActive =
                    currentChatId === chatId;

                  const isEditing =
                    editingChatId === chatId;

                  const memoryActive =
                    chat?.memory_active !== false;

                  return (
                    <div
                      key={chatId}
                      className={`history - item ${isActive ? "active" : ""
                        } ${isEditing ? "editing" : ""
                        } `}
                    >
                      {/* RENAME MODE */}

                      {isEditing ? (
                        <form
                          className="rename-chat-form"
                          onSubmit={(event) =>
                            handleSaveRename(
                              event,
                              chat
                            )
                          }
                        >
                          <input
                            type="text"
                            className="rename-chat-input"
                            value={editingTitle}
                            onChange={(event) =>
                              setEditingTitle(
                                event.target.value
                              )
                            }
                            onKeyDown={(event) =>
                              handleRenameKeyDown(
                                event,
                                chat
                              )
                            }
                            maxLength={80}
                            autoFocus
                            aria-label={`Rename ${chatTitle} `}
                          />

                          <div className="rename-chat-actions">
                            <button
                              type="submit"
                              className="rename-chat-action"
                              disabled={
                                !editingTitle.trim()
                              }
                              title="Save chat name"
                              aria-label="Save chat name"
                            >
                              ✓
                            </button>

                            <button
                              type="button"
                              className="rename-chat-action cancel"
                              onClick={
                                handleCancelRename
                              }
                              title="Cancel rename"
                              aria-label="Cancel rename"
                            >
                              ×
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {/* CHAT SELECT */}

                          <button
                            type="button"
                            className="history-chat-button"
                            onClick={() =>
                              handleSelectChat(
                                chat
                              )
                            }
                            title={chatTitle}
                            aria-label={`Open ${chatTitle} `}
                            aria-current={
                              isActive
                                ? "page"
                                : undefined
                            }
                          >
                            <span
                              className="history-icon"
                              aria-hidden="true"
                            >
                              💬
                            </span>

                            <span className="history-chat-content">
                              <span className="history-title">
                                {chatTitle}
                              </span>

                              <span
                                className={`chat - memory - indicator ${memoryActive
                                    ? "active"
                                    : "inactive"
                                  } `}
                              >
                                <span
                                  className="chat-memory-dot"
                                  aria-hidden="true"
                                />

                                {memoryActive
                                  ? "Memory on"
                                  : "Memory cleared"}
                              </span>
                            </span>
                          </button>

                          {/* CHAT ACTIONS */}

                          <div className="history-actions">
                            {/* CLEAR CHAT MEMORY */}

                            <button
                              type="button"
                              className={`clear - chat - memory - button ${!memoryActive
                                  ? "disabled"
                                  : ""
                                } `}
                              onClick={(event) =>
                                handleClearChatMemory(
                                  event,
                                  chat
                                )
                              }
                              disabled={
                                !memoryActive
                              }
                              title={
                                memoryActive
                                  ? `Clear memory for ${chatTitle}`
                                  : `Memory already cleared for ${chatTitle}`
                              }
                              aria-label={
                                memoryActive
                                  ? `Clear memory for ${chatTitle}`
                                  : `Memory already cleared for ${chatTitle}`
                              }
                            >
                              🧠
                            </button>

                            {/* RENAME */}

                            <button
                              type="button"
                              className="rename-chat-button"
                              onClick={(event) =>
                                handleStartRename(
                                  event,
                                  chat
                                )
                              }
                              title={`Rename ${chatTitle} `}
                              aria-label={`Rename ${chatTitle} `}
                            >
                              ✏️
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              className="delete-chat-button"
                              onClick={(event) =>
                                handleDeleteChat(
                                  event,
                                  chat
                                )
                              }
                              title={`Delete ${chatTitle} `}
                              aria-label={`Delete ${chatTitle} `}
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================
            SIDEBAR FOOTER
        ======================================== */}

        <div className="sidebar-footer">
          {/* CLEAR ALL MEMORY */}

          <button
            type="button"
            className="clear-memory-button"
            onClick={onClearMemory}
            disabled={
              isTemporaryChat ||
              typeof onClearMemory !==
              "function"
            }
            title={
              isTemporaryChat
                ? "Temporary chats use temporary memory"
                : "Clear AI memory for all chats"
            }
            aria-label={
              isTemporaryChat
                ? "Clear all memory unavailable in temporary chat"
                : "Clear AI memory for all chats"
            }
          >
            <span aria-hidden="true">
              🧹
            </span>

            Clear All Memory
          </button>

          {/* MEMORY STATUS */}

          <div
            className={`memory - status ${isTemporaryChat
                ? "memory-active"
                : currentMemoryActive
                  ? "memory-active"
                  : "memory-inactive"
              } `}
            role="status"
            aria-live="polite"
          >
            <span
              className="status-dot"
              aria-hidden="true"
            />

            {isTemporaryChat
              ? "Temporary memory"
              : currentChat
                ? currentMemoryActive
                  ? "Memory enabled"
                  : "Memory cleared"
                : "Memory enabled"}
          </div>

          {/* ACCOUNT */}

          <div className="account-section">
            <div className="account-info">
              <div
                className="account-avatar"
                aria-hidden="true"
              >
                {user?.email
                  ? user.email
                    .charAt(0)
                    .toUpperCase()
                  : "U"}
              </div>

              <div className="account-details">
                <span className="account-label">
                  Signed in as
                </span>

                <span
                  className="account-email"
                  title={
                    user?.email || "User"
                  }
                >
                  {user?.email || "User"}
                </span>
              </div>
            </div>

            {/* LOGOUT */}

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
            >
              <span aria-hidden="true">
                ↪
              </span>

              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

