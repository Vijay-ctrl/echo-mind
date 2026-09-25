import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./Sidebar.css";


const MOBILE_BREAKPOINT = 768;
const SWIPE_THRESHOLD = 70;


function Sidebar({

  // ==========================================
  // MOBILE SIDEBAR CONTROL
  // ==========================================

  isMobileOpen = false,

  onMobileToggle,

  onMobileClose,


  // ==========================================
  // CHAT ACTIONS
  // ==========================================

  onNewChat,

  onStartTemporaryChat,

  onExitTemporaryChat,

  onClearMemory,

  onClearChatMemory,

  onDeleteChat,

  onRenameChat,

  onLogout,


  // ==========================================
  // USER / CHAT DATA
  // ==========================================

  user,

  chatHistory,

  currentChatId,

  onSelectChat,

  isLoadingChats,

  isTemporaryChat,

}) {


  // ==========================================
  // CHAT DATA
  // ==========================================

  const chats =
    Array.isArray(chatHistory)
      ? chatHistory
      : [];


  const persistentChats =
    chats.filter(
      (chat) =>
        chat?.temporary !== true
    );


  // ==========================================
  // STATE
  // ==========================================

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");


  const [
    editingChatId,
    setEditingChatId,
  ] = useState(null);


  const [
    editingTitle,
    setEditingTitle,
  ] = useState("");


  // ==========================================
  // REFS
  // ==========================================

  const touchStartX =
    useRef(null);


  const touchStartY =
    useRef(null);


  const touchCurrentX =
    useRef(null);


  const touchCurrentY =
    useRef(null);


  // ==========================================
  // SEARCH
  // ==========================================

  const normalizedSearchQuery =
    searchQuery
      .trim()
      .toLowerCase();


  const filteredChats =
    persistentChats.filter(
      (chat) => {

        const title =
          chat?.title?.trim() ||
          "Untitled Chat";


        return title
          .toLowerCase()
          .includes(
            normalizedSearchQuery
          );

      }
    );


  // ==========================================
  // CURRENT CHAT
  // ==========================================

  const currentChat =
    chats.find(
      (chat) =>
        chat?.id ===
        currentChatId
    );


  const currentMemoryActive =
    currentChat?.memory_active !==
    false;


  // ==========================================
  // RESET TOUCH STATE
  // ==========================================

  const resetTouchState =
    () => {

      touchStartX.current =
        null;

      touchStartY.current =
        null;

      touchCurrentX.current =
        null;

      touchCurrentY.current =
        null;

    };


  // ==========================================
  // SAFE CLOSE
  // ==========================================

  const closeMobileSidebar =
    () => {

      if (
        typeof onMobileClose ===
        "function"
      ) {

        onMobileClose();

      }


      setEditingChatId(null);

      setEditingTitle("");

      resetTouchState();

    };


  // ==========================================
  // TOGGLE
  // ==========================================

  const toggleMobileSidebar =
    () => {

      if (
        typeof onMobileToggle !==
        "function"
      ) {

        return;

      }


      onMobileToggle();

    };


  // ==========================================
  // ESCAPE KEY
  // ==========================================

  useEffect(() => {

    if (!isMobileOpen) {

      return undefined;

    }


    const handleKeyDown =
      (event) => {

        if (
          event.key ===
          "Escape"
        ) {

          if (
            typeof onMobileClose ===
            "function"
          ) {

            onMobileClose();

          }


          setEditingChatId(null);

          setEditingTitle("");

          resetTouchState();

        }

      };


    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [
    isMobileOpen,
    onMobileClose,
  ]);


  // ==========================================
  // LOCK BODY SCROLL
  // ==========================================

  useEffect(() => {

    if (!isMobileOpen) {

      return undefined;

    }


    const previousOverflow =
      document.body.style.overflow;


    const previousTouchAction =
      document.body.style.touchAction;


    document.body.style.overflow =
      "hidden";


    document.body.style.touchAction =
      "none";


    return () => {

      document.body.style.overflow =
        previousOverflow;


      document.body.style.touchAction =
        previousTouchAction;

    };

  }, [
    isMobileOpen,
  ]);


  // ==========================================
  // CLOSE SIDEBAR WHEN ENTERING DESKTOP
  // ==========================================

  useEffect(() => {

    const mediaQuery =
      window.matchMedia(
        `(min-width: ${MOBILE_BREAKPOINT + 1}px)`
      );


    const handleMediaChange =
      (event) => {

        if (
          event.matches &&
          typeof onMobileClose ===
          "function"
        ) {

          onMobileClose();

          setEditingChatId(null);

          setEditingTitle("");

          resetTouchState();

        }

      };


    if (
      mediaQuery.matches &&
      typeof onMobileClose ===
      "function"
    ) {

      onMobileClose();

      setEditingChatId(null);

      setEditingTitle("");

      resetTouchState();

    }


    if (
      typeof mediaQuery.addEventListener ===
      "function"
    ) {

      mediaQuery.addEventListener(
        "change",
        handleMediaChange
      );

    } else {

      mediaQuery.addListener(
        handleMediaChange
      );

    }


    return () => {

      if (
        typeof mediaQuery.removeEventListener ===
        "function"
      ) {

        mediaQuery.removeEventListener(
          "change",
          handleMediaChange
        );

      } else {

        mediaQuery.removeListener(
          handleMediaChange
        );

      }

    };

  }, [
    onMobileClose,
  ]);


  // ==========================================
  // VALIDATE EDITING CHAT
  // ==========================================

  useEffect(() => {

    if (
      editingChatId &&
      !persistentChats.some(
        (chat) =>
          chat?.id ===
          editingChatId
      )
    ) {

      setEditingChatId(null);

      setEditingTitle("");

    }

  }, [
    persistentChats,
    editingChatId,
  ]);


  // ==========================================
  // TEMPORARY CHAT RESET
  // ==========================================

  useEffect(() => {

    if (isTemporaryChat) {

      setSearchQuery("");

      setEditingChatId(null);

      setEditingTitle("");

    }

  }, [
    isTemporaryChat,
  ]);


  // ==========================================
  // TOUCH START
  // ==========================================

  const handleTouchStart =
    (event) => {

      if (!isMobileOpen) {

        return;

      }


      const target =
        event.target;


      /*
       * Do not start sidebar swipe tracking
       * when interacting with controls.
       */
      if (
        target?.closest?.(
          "button, input, textarea, select, a, form"
        )
      ) {

        resetTouchState();

        return;

      }


      const touch =
        event.touches?.[0];


      if (!touch) {

        return;

      }


      touchStartX.current =
        touch.clientX;


      touchStartY.current =
        touch.clientY;


      touchCurrentX.current =
        touch.clientX;


      touchCurrentY.current =
        touch.clientY;

    };


  // ==========================================
  // TOUCH MOVE
  // ==========================================

  const handleTouchMove =
    (event) => {

      if (
        !isMobileOpen ||
        touchStartX.current === null ||
        touchStartY.current === null
      ) {

        return;

      }


      const touch =
        event.touches?.[0];


      if (!touch) {

        return;

      }


      touchCurrentX.current =
        touch.clientX;


      touchCurrentY.current =
        touch.clientY;

    };


  // ==========================================
  // TOUCH END
  // ==========================================

  const handleTouchEnd =
    () => {

      if (
        !isMobileOpen ||
        touchStartX.current === null ||
        touchStartY.current === null ||
        touchCurrentX.current === null ||
        touchCurrentY.current === null
      ) {

        resetTouchState();

        return;

      }


      const deltaX =
        touchCurrentX.current -
        touchStartX.current;


      const deltaY =
        touchCurrentY.current -
        touchStartY.current;


      const horizontalDistance =
        Math.abs(deltaX);


      const verticalDistance =
        Math.abs(deltaY);


      /*
       * Only close for a genuine horizontal
       * left swipe.
       *
       * This prevents normal vertical scrolling
       * from closing the sidebar.
       */
      const isHorizontalSwipe =
        horizontalDistance >
        verticalDistance;


      const isLeftSwipe =
        deltaX <=
        -SWIPE_THRESHOLD;


      if (
        isHorizontalSwipe &&
        isLeftSwipe
      ) {

        closeMobileSidebar();

        return;

      }


      resetTouchState();

    };


  // ==========================================
  // START RENAME
  // ==========================================

  const handleStartRename =
    (
      event,
      chat
    ) => {

      event.stopPropagation();


      if (
        !chat?.id ||
        chat?.temporary === true
      ) {

        return;

      }


      setEditingChatId(
        chat.id
      );


      setEditingTitle(
        chat?.title?.trim() ||
        "Untitled Chat"
      );

    };


  // ==========================================
  // CANCEL RENAME
  // ==========================================

  const handleCancelRename =
    (event) => {

      event?.stopPropagation();

      setEditingChatId(null);

      setEditingTitle("");

    };


  // ==========================================
  // SAVE RENAME
  // ==========================================

  const handleSaveRename =
    async (
      event,
      chat
    ) => {

      event.preventDefault();

      event.stopPropagation();


      const chatId =
        chat?.id;


      const newTitle =
        editingTitle.trim();


      const oldTitle =
        chat?.title?.trim() ||
        "Untitled Chat";


      if (
        !chatId ||
        !newTitle ||
        chat?.temporary === true
      ) {

        return;

      }


      if (
        newTitle ===
        oldTitle
      ) {

        handleCancelRename(
          event
        );

        return;

      }


      if (
        typeof onRenameChat !==
        "function"
      ) {

        console.error(
          "onRenameChat callback is not provided."
        );

        return;

      }


      try {

        await onRenameChat(
          chatId,
          newTitle
        );


        setEditingChatId(null);

        setEditingTitle("");

      } catch (error) {

        console.error(
          "Failed to rename chat:",
          error
        );

      }

    };


  // ==========================================
  // RENAME KEYBOARD
  // ==========================================

  const handleRenameKeyDown =
    (
      event,
      chat
    ) => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        handleSaveRename(
          event,
          chat
        );

      }


      if (
        event.key ===
        "Escape"
      ) {

        event.preventDefault();

        handleCancelRename(
          event
        );

      }

    };


  // ==========================================
  // CLEAR CHAT MEMORY
  // ==========================================

  const handleClearChatMemory =
    (
      event,
      chat
    ) => {

      event.stopPropagation();


      if (
        !chat?.id ||
        chat?.memory_active ===
        false
      ) {

        return;

      }


      if (
        typeof onClearChatMemory !==
        "function"
      ) {

        console.error(
          "onClearChatMemory callback is not provided."
        );

        return;

      }


      onClearChatMemory(
        chat.id
      );

    };


  // ==========================================
  // DELETE CHAT
  // ==========================================

  const handleDeleteChat =
    (
      event,
      chat
    ) => {

      event.stopPropagation();


      if (!chat?.id) {

        return;

      }


      if (
        typeof onDeleteChat !==
        "function"
      ) {

        console.error(
          "onDeleteChat callback is not provided."
        );

        return;

      }


      onDeleteChat(
        chat.id
      );

    };


  // ==========================================
  // SELECT CHAT
  // ==========================================

  const handleSelectChat =
    (chat) => {

      if (
        typeof onSelectChat !==
        "function"
      ) {

        console.error(
          "onSelectChat callback is not provided."
        );

        return;

      }


      if (
        !chat?.id ||
        chat?.temporary === true
      ) {

        return;

      }


      onSelectChat(
        chat
      );

    };


  // ==========================================
  // NEW CHAT
  // ==========================================

  const handleNewChat =
    () => {

      if (
        typeof onNewChat ===
        "function"
      ) {

        onNewChat();

      }


      closeMobileSidebar();

    };


  // ==========================================
  // TEMPORARY CHAT
  // ==========================================

  const handleStartTemporaryChat =
    () => {

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


  // ==========================================
  // EXIT TEMPORARY CHAT
  // ==========================================

  const handleExitTemporaryChat =
    () => {

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


  // ==========================================
  // HISTORY COUNT
  // ==========================================

  const historyCount =
    normalizedSearchQuery
      ? filteredChats.length
      : persistentChats.length;


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <>

      {/* =====================================
             MOBILE SIDEBAR TOGGLE
         ===================================== */}

      <button

        type="button"

        className={
          `mobile-sidebar-toggle ${isMobileOpen
            ? "open"
            : ""
          }`
        }

        onClick={
          toggleMobileSidebar
        }

        aria-label={
          isMobileOpen
            ? "Close chat sidebar"
            : "Open chat sidebar"
        }

        aria-expanded={
          isMobileOpen
        }

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

          {isMobileOpen
            ? "×"
            : "☰"}

        </span>

      </button>


      {/* =====================================
             MOBILE OVERLAY
         ===================================== */}

      <button

        type="button"

        className={
          `sidebar-overlay ${isMobileOpen
            ? "visible"
            : ""
          }`
        }

        onClick={
          closeMobileSidebar
        }

        aria-label="Close chat sidebar"

        tabIndex={
          isMobileOpen
            ? 0
            : -1
        }

      />


      {/* =====================================
             SIDEBAR
         ===================================== */}

      <aside

        className={
          `sidebar ${isMobileOpen
            ? "mobile-open"
            : ""
          }`
        }

        onTouchStart={
          handleTouchStart
        }

        onTouchMove={
          handleTouchMove
        }

        onTouchEnd={
          handleTouchEnd
        }

      >


        {/* ==================================
                SIDEBAR HEADER
            ================================== */}

        <div className="sidebar-header">

          <div className="logo">

            <div
              className="logo-icon"
              aria-hidden="true"
            >
              ✦
            </div>


            <div>

              <h2>
                EchoMind
              </h2>

              <span>
                AI + Web Search
              </span>

            </div>

          </div>


          <button

            type="button"

            className="mobile-sidebar-close"

            onClick={
              closeMobileSidebar
            }

            aria-label="Close sidebar"

            title="Close sidebar"

          >
            ×
          </button>

        </div>


        {/* ==================================
                SIDEBAR ACTIONS
            ================================== */}

        <div className="sidebar-actions">


          {!isTemporaryChat && (

            <button

              type="button"

              className="new-chat-button"

              onClick={
                handleNewChat
              }

              disabled={
                isLoadingChats
              }

              title="Start a new chat"

              aria-label="Start a new chat"

            >

              <span
                aria-hidden="true"
              >
                ＋
              </span>

              New Chat

            </button>

          )}


          {!isTemporaryChat ? (

            <button

              type="button"

              className="temporary-chat-button"

              onClick={
                handleStartTemporaryChat
              }

              disabled={
                isLoadingChats
              }

              title="Start a temporary chat"

              aria-label="Start a temporary chat"

            >

              <span
                aria-hidden="true"
              >
                🕶️
              </span>

              Temporary Chat

            </button>

          ) : (

            <button

              type="button"

              className="exit-temporary-chat-button"

              onClick={
                handleExitTemporaryChat
              }

              title="Exit temporary chat"

              aria-label="Exit temporary chat"

            >

              <span
                aria-hidden="true"
              >
                ✕
              </span>

              Exit Temporary Chat

            </button>

          )}

        </div>


        {/* ==================================
                TEMPORARY CHAT INFO
            ================================== */}

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
                This conversation won't appear in your chat history.
              </span>

            </div>

          </div>

        )}


        {/* ==================================
                CHAT HISTORY
            ================================== */}

        {!isTemporaryChat && (

          <div className="history-section">


            <div className="history-header">

              <span>
                Recent Chats
              </span>


              <span
                className="history-count"
                aria-label={
                  `${historyCount} chats`
                }
              >
                {historyCount}
              </span>

            </div>


            {!isLoadingChats &&
              persistentChats.length >
              0 && (

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

                    value={
                      searchQuery
                    }

                    onChange={
                      (event) =>
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

                      onClick={() =>
                        setSearchQuery("")
                      }

                      title="Clear search"

                      aria-label="Clear search"

                    >
                      ×
                    </button>

                  )}

                </div>

              )}


            <div className="history-list">


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

                filteredChats.map(
                  (chat) => {

                    const chatId =
                      chat?.id;


                    const chatTitle =
                      chat?.title?.trim() ||
                      "Untitled Chat";


                    const isActive =
                      currentChatId ===
                      chatId;


                    const isEditing =
                      editingChatId ===
                      chatId;


                    const memoryActive =
                      chat?.memory_active !==
                      false;


                    return (

                      <div

                        key={
                          chatId
                        }

                        className={
                          `history-item ${isActive
                            ? "active"
                            : ""
                          } ${isEditing
                            ? "editing"
                            : ""
                          }`
                        }

                      >


                        {isEditing ? (

                          <form

                            className="rename-chat-form"

                            onSubmit={
                              (event) =>
                                handleSaveRename(
                                  event,
                                  chat
                                )
                            }

                          >

                            <input

                              type="text"

                              className="rename-chat-input"

                              value={
                                editingTitle
                              }

                              onChange={
                                (event) =>
                                  setEditingTitle(
                                    event.target.value
                                  )
                              }

                              onKeyDown={
                                (event) =>
                                  handleRenameKeyDown(
                                    event,
                                    chat
                                  )
                              }

                              maxLength={80}

                              autoFocus

                              aria-label={
                                `Rename ${chatTitle}`
                              }

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

                            <button

                              type="button"

                              className="history-chat-button"

                              onClick={() =>
                                handleSelectChat(
                                  chat
                                )
                              }

                              title={
                                chatTitle
                              }

                              aria-label={
                                `Open ${chatTitle}`
                              }

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
                                  className={
                                    `chat-memory-indicator ${memoryActive
                                      ? "active"
                                      : "inactive"
                                    }`
                                  }
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


                            <div className="history-actions">


                              <button

                                type="button"

                                className={
                                  `clear-chat-memory-button ${!memoryActive
                                    ? "disabled"
                                    : ""
                                  }`
                                }

                                onClick={
                                  (event) =>
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


                              <button

                                type="button"

                                className="rename-chat-button"

                                onClick={
                                  (event) =>
                                    handleStartRename(
                                      event,
                                      chat
                                    )
                                }

                                title={
                                  `Rename ${chatTitle}`
                                }

                                aria-label={
                                  `Rename ${chatTitle}`
                                }

                              >
                                ✏️
                              </button>


                              <button

                                type="button"

                                className="delete-chat-button"

                                onClick={
                                  (event) =>
                                    handleDeleteChat(
                                      event,
                                      chat
                                    )
                                }

                                title={
                                  `Delete ${chatTitle}`
                                }

                                aria-label={
                                  `Delete ${chatTitle}`
                                }

                              >
                                🗑️
                              </button>


                            </div>

                          </>

                        )}

                      </div>

                    );

                  }
                )

              )}

            </div>

          </div>

        )}


        {/* ==================================
                SIDEBAR FOOTER
            ================================== */}

        <div className="sidebar-footer">


          <button

            type="button"

            className="clear-memory-button"

            onClick={
              onClearMemory
            }

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

            <span
              aria-hidden="true"
            >
              🧹
            </span>

            Clear All Memory

          </button>


          <div

            className={
              `memory-status ${isTemporaryChat

                ? "memory-active"

                : currentChat

                  ? currentMemoryActive
                    ? "memory-active"
                    : "memory-inactive"

                  : "memory-active"
              }`
            }

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
                    user?.email ||
                    "User"
                  }
                >
                  {user?.email ||
                    "User"}
                </span>

              </div>

            </div>


            <button

              type="button"

              className="logout-button"

              onClick={
                onLogout
              }

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