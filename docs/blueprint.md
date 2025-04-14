# **App Name**: VocabMaster Arabic

## Core Features:

- Word Display: Display a word in a large, clear format with optional translation.
- Bulk Word Input: Allow users to input word/translation pairs via a text area, with bulk input support. The AI tool will parse the words and translations and store them internally.
- Flashcard Review: Implement a flashcard interface with 'Easy' and 'Hard' buttons to track learning progress.
- Hard Word Tracking: Maintain a list of 'hard' words for focused review and allow the user to copy all hard words.
- Copy hard words.: Provide a button to copy the list of hard words to the clipboard.

## Style Guidelines:

- Accent color: Use #3b82f6 (blue) for interactive elements like buttons, links, and highlights.
- Primary color: #b91c1c (Red) for main call to actions.
- Cards: Employ the glass effect with navy and orange gradients for visual appeal.
- Use the 'Cairo' font for a modern and readable Arabic script.
- Incorporate clear, minimalist icons for key actions.

## Original User Request:
<>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>مراجعة الكلمات (تحديثات 2025)</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap"
    rel="stylesheet"
  />
  <style
    dangerouslySetInnerHTML={{
      __html:
        "\n        /* --- Base Styles (Mostly Same) --- */\n        :root {\n            --bg-dark-primary: #0a0f1a;\n            --bg-dark-secondary: #151c2a;\n            --bg-dark-tertiary: #2a3447;\n            --bg-dark-quaternary: #3e4859;\n            --border-dark: #2a3447;\n            --border-dark-focus: #60a5fa; /* Light Blue */\n            --text-light-primary: #e5e7eb;\n            --text-light-secondary: #d1d5db;\n            --text-light-tertiary: #9ca3af;\n            --text-placeholder: #6b7280;\n            --primary-color: #b91c1c; /* Red */\n            --primary-color-hover: #9b1717;\n            --secondary-color: #3e4859; /* Gray */\n            --secondary-color-hover: #2a3447;\n            --success-color: #137c3a; /* Green */\n            --success-color-hover: #106632;\n            --danger-color: #b91c1c; /* Red */\n            --danger-color-hover: #9b1717;\n            --danger-outline-color: #e55e5e;\n            --danger-outline-hover-bg: rgba(185, 28, 28, 0.1);\n            --info-color: #3b82f6; /* Blue - Added for Review Button */\n            --info-color-hover: #2563eb; /* Darker Blue */\n            --font-family-base: 'Cairo', sans-serif;\n            --border-radius-lg: 0.75rem;\n            --border-radius-md: 0.5rem;\n            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);\n            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);\n            --blur: 8px;\n\n            /* --- NEW: Glass Effect Gradient Colors --- */\n            --gradient-navy-base: 210, 65%, 12%; /* HSL values for #0a192f */\n            --gradient-orange-base: 16, 100%, 50%; /* HSL values for #ff4500 */\n            --gradient-navy-alpha-40: hsla(var(--gradient-navy-base), 0.4);\n            --gradient-orange-alpha-15: hsla(var(--gradient-orange-base), 0.15);\n            --gradient-orange: hsl(var(--gradient-orange-base));\n\n            --white: hsl(0, 0%, 100%);\n            --white0: hsla(0, 0%, 100%, 0);\n            --white50: hsla(0, 0%, 100%, 0.05); /* Keep for fallback or other uses */\n            --white100: hsla(0, 0%, 50%, 0.3);\n            --white200: hsla(0, 0%, 50%, 0.4);\n            --white300: hsla(0, 0%, 80%, 0.5);\n\n            font-size: clamp(0.95rem, 0.75rem + 0.6vw, 1.85rem);\n        }\n        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; border: 0; }\n        html, body { background-color: var(--bg-dark-primary); color: var(--text-light-primary); font-family: var(--font-family-base); line-height: 1.5; }\n        body { min-height: 100vh; display: grid; place-items: center; padding: 0.5rem; background: linear-gradient(90deg, var(--bg-dark-secondary), var(--bg-dark-primary)); /* Add padding-top for fixed header */ padding-top: 4rem; }\n        .hidden { display: none !important; }\n        .container { width: 100%; max-width: 36rem; margin-left: auto; margin-right: auto; }\n        @media (min-width: 768px) { .container { max-width: 42rem; } }\n        .page { transition: opacity 0.3s ease-in-out; }\n        .heading-1 { font-size: 1.875rem; font-weight: 700; text-align: center; color: var(--border-dark-focus); margin-bottom: 1rem; }\n        @media (min-width: 768px) { .heading-1 { font-size: 2.25rem; margin-bottom: 1.5rem; } }\n        .heading-2 { font-size: 1.125rem; font-weight: 600; color: var(--text-light-primary); margin-bottom: 0.75rem; }\n        @media (min-width: 768px) { .heading-2 { font-size: 1.25rem; } }\n\n        /* --- Updated Card Glass Effect --- */\n        .card {\n            padding: 1.25rem; border-radius: var(--border-radius-lg); transition: all 0.3s ease-in-out; text-align: center; color: var(--text-light-primary); background-color: transparent; border: none; box-shadow: none; position: relative; backdrop-filter: blur(var(--blur)); -webkit-backdrop-filter: blur(var(--blur));\n            /* New Gradient */\n            background-image: linear-gradient(-90deg, var(--gradient-navy-alpha-40), var(--gradient-orange-alpha-15));\n            overflow: hidden;\n        }\n        /* RTL Gradient Direction (already correct, using -90deg) */\n        .card:before, .card:after { content: \"\"; position: absolute; inset: 0; border-radius: inherit; z-index: -1; }\n        .card:before {\n             border: 1px solid var(--white300); /* Use a subtle white/gray border */\n             mask-image: linear-gradient(-135deg, var(--white), var(--white0) 50%);\n             -webkit-mask-image: linear-gradient(-135deg, var(--white), var(--white0) 50%);\n        }\n        .card:after {\n            border: 1px solid var(--gradient-orange); /* New orange border */\n            mask-image: linear-gradient(-135deg, var(--white0) 50%, var(--white));\n            -webkit-mask-image: linear-gradient(-135deg, var(--white0) 50%, var(--white));\n         }\n        /* --- End Updated Card Styles --- */\n\n        .card--add { text-align: right; margin-bottom: 1rem; }\n        .card--word-display { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2rem; padding: 1.5rem; }\n        .card--auth { max-width: 28rem; margin: 2rem auto; text-align: right; }\n        @media (min-width: 768px) { .card { padding: 1.5rem; } .card--word-display { padding: 1.5rem; } }\n        .word-display-large { font-size: clamp(2rem, 13vw, 6.5rem); font-weight: 700; color: white; text-align: center; word-break: break-word; overflow-wrap: break-word; line-height: 1.1; width: 100%; padding: 0.25rem 0; margin-bottom: 0.25rem; min-height: 1.2em; direction: ltr; unicode-bidi: embed; }\n        #wordDisplayCard #translationDisplay { font-size: 1rem; color: var(--text-light-secondary); margin-top: 0; margin-bottom: 0; font-weight: 400; text-align: center; word-break: break-word; width: 100%; padding-bottom: 0.5rem; min-height: 1.2em; }\n        @media (min-width: 768px) { #wordDisplayCard #translationDisplay { font-size: 1.125rem; } }\n        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; padding: 0.5rem 1rem; border-radius: var(--border-radius-md); font-weight: 600; color: white; transition: all 0.2s ease-in-out; box-shadow: var(--shadow-md); border: none; cursor: pointer; font-size: 0.75rem; line-height: 1.25; text-decoration: none; }\n        @media (min-width: 768px) { .btn { font-size: 0.875rem; gap: 0.5rem; } }\n        .btn:disabled { opacity: 0.5; cursor: not-allowed; background-color: var(--secondary-color) !important; /* Ensure disabled state is clear */ box-shadow: none; }\n        .btn:focus { outline: none; box-shadow: 0 0 0 3px var(--bg-dark-primary), 0 0 0 5px var(--border-dark-focus); }\n        .btn--sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; gap: 0.25rem; border-radius: 0.375rem; }\n        .btn--primary { background-color: var(--primary-color); }\n        .btn--primary:hover:not(:disabled) { background-color: var(--primary-color-hover); }\n        .btn--secondary { background-color: var(--secondary-color); }\n        .btn--secondary:hover:not(:disabled) { background-color: var(--secondary-color-hover); }\n        .btn--info { background-color: var(--info-color); } /* Added Info color */\n        .btn--info:hover:not(:disabled) { background-color: var(--info-color-hover); }\n        .btn--info:focus { box-shadow: 0 0 0 3px var(--bg-dark-primary), 0 0 0 5px var(--info-color); }\n        .btn--action { padding: 0.625rem 1.25rem; font-size: 0.875rem; font-weight: 700; border-radius: var(--border-radius-md); gap: 0.25rem; }\n        .btn--action:hover:not(:disabled) { transform: scale(1.05); }\n        .btn--success { background-color: var(--success-color); }\n        .btn--success:hover:not(:disabled) { background-color: var(--success-color-hover); }\n        .btn--success:focus { box-shadow: 0 0 0 3px var(--bg-dark-primary), 0 0 0 5px var(--success-color); }\n        .btn--danger { background-color: var(--danger-color); }\n        .btn--danger:hover:not(:disabled) { background-color: var(--danger-color-hover); }\n        .btn--danger:focus { box-shadow: 0 0 0 3px var(--bg-dark-primary), 0 0 0 5px var(--danger-color); }\n        .btn--full-width { width: 100%; }\n        .btn--fixed { position: fixed; bottom: 1rem; left: 1rem; z-index: 1000; padding: 0.5rem 1rem; background-color: var(--secondary-color); }\n        .btn--fixed:hover:not(:disabled) { background-color: var(--secondary-color-hover); }\n        .label { display: block; font-size: 0.75rem; font-weight: 500; color: var(--text-light-secondary); margin-bottom: 0.25rem; }\n        .input-field, .textarea-field { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 1rem; background-color: var(--bg-dark-primary); border: 1px solid var(--border-dark); border-radius: var(--border-radius-md); font-size: 0.875rem; box-shadow: var(--shadow-md); color: var(--text-light-primary); }\n        .textarea-field { min-height: 80px; line-height: 1.5; }\n        .input-field::placeholder, .textarea-field::placeholder { color: var(--text-placeholder); }\n        .input-field:focus, .textarea-field:focus { outline: none; border-color: var(--border-dark-focus); box-shadow: 0 0 0 1px var(--border-dark-focus); }\n        .textarea-readonly { background-color: var(--bg-dark-tertiary); border-color: var(--border-dark); color: var(--text-light-secondary); cursor: default; }\n        .textarea-readonly:focus { border-color: var(--border-dark); box-shadow: none; }\n        .textarea-readonly.output-list { direction: ltr; text-align: left; }\n        .input-container { margin-bottom: 0.25rem; }\n        .message { font-size: 0.75rem; margin-top: 0.5rem; text-align: center; min-height: 1rem; }\n        .message--small { margin-top: 0.25rem; min-height: 0.75rem; }\n        .message--success { color: var(--success-color); }\n        .message--error { color: var(--danger-color); }\n        .message--info { color: var(--text-light-secondary); }\n        .message--warning { color: #facc15; }\n        .message--default { color: var(--text-light-tertiary); }\n        .button-group { display: flex; justify-content: center; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; /* Allow wrapping */ }\n        .margin-top-1 { margin-top: 0.25rem; } .margin-top-2 { margin-top: 0.5rem; } .margin-top-3 { margin-top: 0.75rem; } .margin-top-4 { margin-top: 1rem; } .margin-top-5 { margin-top: 1.25rem; } .margin-top-7 { margin-top: 1.75rem; }\n        .margin-bottom-3 { margin-bottom: 0.75rem; } .margin-bottom-4 { margin-bottom: 1rem; } .margin-bottom-6 { margin-bottom: 1.5rem; }\n        .padding-top-3 { padding-top: 0.75rem; } .padding-top-4 { padding-top: 1rem; }\n        .border-top { border-top: 1px solid var(--border-dark); }\n        .loader { display: inline-block; animation: spin 1s linear infinite; border-radius: 50%; width: 1rem; height: 1rem; border-top: 2px solid white; border-bottom: 2px solid white; border-left: 2px solid transparent; border-right: 2px solid transparent; margin-left: 0.5rem; }\n        .btn .loader { margin-left: 0; margin-right: 0.5rem; }\n        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n        .small-text { font-size: 0.625rem; color: var(--text-light-tertiary); }\n        @media (min-width: 768px) { .small-text { font-size: 0.75rem; } }\n        .icon { width: 1rem; height: 1rem; display: inline-block; vertical-align: middle; }\n        .icon--sm { width: 0.75rem; height: 0.75rem; }\n        .icon--lg { width: 1.25rem; height: 1.25rem; }\n\n        /* --- Fixed Header Styles --- */\n        #fixedHeader {\n            position: fixed;\n            top: 0;\n            left: 0;\n            right: 0;\n            z-index: 1001; /* Above other content */\n            background-color: var(--bg-dark-secondary);\n            padding: 0.5rem 1rem;\n            display: flex;\n            justify-content: space-between; /* Pushes items to ends */\n            align-items: center;\n            box-shadow: var(--shadow-md);\n        }\n        #fixedHeader #authStatus {\n            padding: 0; /* Remove default padding */\n            margin: 0; /* Remove default margin */\n            font-size: 0.8rem;\n            color: var(--text-light-secondary);\n            display: flex; /* Use flex for internal alignment if needed */\n            align-items: center;\n            gap: 0.5rem; /* Space between email and button */\n        }\n        #fixedHeader #authStatus span { font-weight: 600; color: var(--text-light-primary); }\n        #fixedHeader #logoutBtn {\n            /* float: none; Replaced by flexbox */\n            /* margin-right: auto; Not needed with justify-content: space-between */\n            margin-left: 0; /* Ensure no extra margin */\n        }\n        /* --- End Fixed Header Styles --- */\n\n        #mainAppContainer { transition: opacity 0.3s ease-in-out; }\n        .link-like { background: none; border: none; color: var(--border-dark-focus); text-decoration: underline; cursor: pointer; font-size: 0.75rem; padding: 0; margin-top: 0.5rem; }\n        .link-like:hover { color: #3b82f6; }\n        #globalStatus { position: fixed; top: 4rem; /* Adjust for fixed header */ left: 50%; transform: translateX(-50%); background: var(--bg-dark-tertiary); padding: 0.5rem 1rem; border-radius: var(--border-radius-md); z-index: 2000; display: none; box-shadow: var(--shadow-lg); text-align: center; color: var(--text-light-primary); }\n        #globalStatus.message-error { background-color: var(--danger-color); color: white; }\n        #globalStatus.message-success { background-color: var(--success-color); color: white; }\n        #globalStatus.message-warning { background-color: #d97706; color: white; }\n        #globalStatus.message-info { background-color: var(--bg-dark-tertiary); color: var(--text-light-primary); }\n\n        /* --- MODIFIED: Center buttons --- */\n        .hard-words-button-group {\n            display: flex;\n            gap: 0.5rem;\n            margin-top: 0.5rem;\n            justify-content: center; /* Changed from flex-start */\n        }\n\n        /* --- Specific Button Style Updates --- */\n        #gotoReviewBtn_FromAdd {\n            background-color: var(--info-color); /* Blue */\n            font-size: 1rem; /* Larger font */\n            padding: 0.75rem 1.5rem; /* More padding */\n        }\n        #gotoReviewBtn_FromAdd:hover:not(:disabled) {\n             background-color: var(--info-color-hover); /* Darker Blue on hover */\n        }\n        #gotoReviewBtn_FromAdd:focus {\n            box-shadow: 0 0 0 3px var(--bg-dark-primary), 0 0 0 5px var(--info-color);\n        }\n\n        /* Style for the new Previous button */\n        #prevWordBtn {\n            /* Style similar to showTranslationBtn but maybe slightly different */\n             padding: 0.5rem 0.75rem;\n             font-size: 1rem; /* Make arrow larger */\n             line-height: 1; /* Adjust line height for arrow */\n             background-color: var(--secondary-color);\n        }\n        #prevWordBtn:hover:not(:disabled) {\n             background-color: var(--secondary-color-hover);\n        }\n        #prevWordBtn .icon { width: 1.25rem; height: 1.25rem; } /* Larger icon if using SVG */\n\n    "
    }}
  />
  <div id="fixedHeader" className="hidden">
    {" "}
    <div id="authStatus">
      مرحباً <span id="userEmailDisplay" />
    </div>
    <button type="button" id="logoutBtn" className="btn btn--secondary btn--sm">
      تسجيل الخروج
    </button>
  </div>
  <div className="container">
    <div id="authSection" className="hidden">
      <div className="card card--auth">
        <form id="loginForm">
          <h2 className="heading-2">تسجيل الدخول</h2>
          <div className="input-container margin-bottom-3">
            <label htmlFor="loginEmail" className="label">
              البريد الإلكتروني:
            </label>
            <input
              type="email"
              id="loginEmail"
              className="input-field"
              placeholder="email@example.com"
              required=""
            />
          </div>
          <div className="input-container margin-bottom-4">
            <label htmlFor="loginPassword" className="label">
              كلمة المرور:
            </label>
            <input
              type="password"
              id="loginPassword"
              className="input-field"
              required=""
            />
          </div>
          <button
            type="submit"
            id="loginBtn"
            className="btn btn--primary btn--full-width"
          >
            تسجيل الدخول
          </button>
          <p id="loginMessage" className="message message--default" />
          <button type="button" id="showSignupBtn" className="link-like">
            ليس لديك حساب؟ إنشاء حساب جديد
          </button>
        </form>
        <form id="signupForm" className="hidden">
          <h2 className="heading-2">إنشاء حساب جديد</h2>
          <div className="input-container margin-bottom-3">
            <label htmlFor="signupEmail" className="label">
              البريد الإلكتروني:
            </label>
            <input
              type="email"
              id="signupEmail"
              className="input-field"
              placeholder="email@example.com"
              required=""
            />
          </div>
          <div className="input-container margin-bottom-4">
            <label htmlFor="signupPassword" className="label">
              كلمة المرور:
            </label>
            <input
              type="password"
              id="signupPassword"
              className="input-field"
              required=""
              placeholder="6 أحرف على الأقل"
            />
          </div>
          <button
            type="submit"
            id="signupBtn"
            className="btn btn--primary btn--full-width"
          >
            إنشاء حساب
          </button>
          <p id="signupMessage" className="message message--default" />
          <button type="button" id="showLoginBtn" className="link-like">
            لديك حساب بالفعل؟ تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
    <div id="mainAppContainer" className="hidden">
      <h1 className="heading-1"> أداة مراجعة الكلمات </h1>
      <div id="pageAddWords" className="page">
        <div className="card card--add">
          <h2 className="heading-2">1. إضافة كلمات جديدة</h2>
          <div className="input-container">
            <label htmlFor="bulkInput" className="label">
              ألصق النص (كل سطر: كلمة وترجمتها بأي ترتيب):
            </label>
            <textarea
              id="bulkInput"
              className="textarea-field"
              rows={5}
              placeholder="أمثلة:
Hello : مرحباً
كتاب = Book
World	عالم
سيارة Car"
              defaultValue={""}
            />
          </div>
          <p
            id="pasteMessage"
            className="message message--small message--default"
          />
          <button
            type="button"
            id="addBulkBtn"
            className="btn btn--primary btn--full-width margin-top-3"
            disabled=""
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon--lg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            <span id="addBtnText">إضافة الكلمات</span>
            <span id="addBtnLoader" className="loader hidden" />
          </button>
          <p id="addMessage" className="message message--default" />
          <div className="paste-button-container margin-top-4">
            <button
              type="button"
              id="pasteBtn"
              title="لصق من الحافظة"
              className="btn btn--secondary btn--sm btn--full-width"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="icon"
              >
                <path
                  fillRule="evenodd"
                  d="M15.99 4.01h-1.48a3.5 3.5 0 00-6.98 0H6.01a2 2 0 00-2 2v10a2 2 0 002 2h9.98a2 2 0 002-2V6.01a2 2 0 00-2-2zm-8.98 14V6.01h1.48v-.03a2 2 0 114 0v.03h1.48l.01 11.99H7.01zm4.49-11.03a.5.5 0 00-1 0v.03h1v-.03z"
                  clipRule="evenodd"
                />
              </svg>
              <span>لصق من الحافظة</span>
            </button>
          </div>
          <div className="margin-top-5 border-top padding-top-4">
            <button
              type="button"
              id="gotoReviewBtn_FromAdd"
              className="btn btn--info btn--full-width margin-bottom-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="icon icon--lg"
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.03a.75.75 0 000-1.5H4.333a.75.75 0 00-.75.75v3.167a.75.75 0 001.5 0v-2.03l.31.312a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00-1.449.389A7 7 0 003.028 10.07l-.31.311H4.75a.75.75 0 000-1.5H1.583a.75.75 0 00-.75.75v3.167a.75.75 0 001.5 0v-2.03l.312-.31a5.5 5.5 0 019.201-2.466.75.75 0 001.449-.39z"
                  clipRule="evenodd"
                />
              </svg>
              بدء المراجعة
            </button>
          </div>
        </div>
      </div>
      <div id="pageReview" className="page hidden">
        <div id="wordDisplayCard" className="card--word-display hidden">
          <div id="wordDisplayLarge" className="word-display-large" />
          <div id="translationDisplay" className="translation-display hidden" />
        </div>
        <div className="card">
          <div id="flashcardContainer" className="hidden">
            <p id="progressDisplay" className="small-text margin-bottom-3" />
            <div
              className="button-group margin-bottom-3"
              style={{ justifyContent: "center", gap: "0.75rem" }}
            >
              <button
                type="button"
                id="prevWordBtn"
                className="btn btn--sm"
                title="الكلمة السابقة"
                disabled=""
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />{" "}
                </svg>{" "}
              </button>
              <button
                type="button"
                id="showTranslationBtn"
                className="btn btn--secondary btn--sm"
              >
                إظهار/إخفاء الترجمة
              </button>
            </div>
            <div id="difficultyButtonsContainer" className="button-group">
              <button
                type="button"
                id="markEasyBtn"
                className="btn btn--action btn--success"
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />{" "}
                </svg>{" "}
                أعرفها (سهلة){" "}
              </button>
              <button
                type="button"
                id="markHardBtn"
                className="btn btn--action btn--danger"
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  {" "}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />{" "}
                </svg>{" "}
                لا أعرفها (صعبة){" "}
              </button>
            </div>
          </div>
          <p id="sessionMessage" className="message message--info" />
          <div
            id="hardWordsListContainer"
            className="margin-top-4 border-top padding-top-3 hidden"
          >
            <h3
              className="heading-2"
              style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}
            >
              الكلمات المتبقية للمراجعة:
            </h3>
            <textarea
              id="hardWordsOutput"
              rows={4}
              readOnly=""
              className="textarea-field textarea-readonly output-list"
              style={{ fontSize: "0.75rem" }}
              defaultValue={""}
            />
            <div className="hard-words-button-group margin-top-2">
              <button
                type="button"
                id="copyHardWordsBtn"
                className="btn btn--secondary btn--sm"
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="icon icon--sm"
                >
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 100 2h4a1 1 0 100-2H5z" />
                </svg>{" "}
                نسخ القائمة{" "}
              </button>
              <button
                type="button"
                id="deleteAllHardWordsBtn"
                className="btn btn--danger btn--sm"
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon icon--sm"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  {" "}
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />{" "}
                </svg>{" "}
                <span id="deleteBtnText">حذف الكل</span>{" "}
                <span id="deleteBtnLoader" className="loader hidden" />{" "}
              </button>
            </div>
            <p
              id="copyMessage"
              className="message message--small message--default"
            />
            <p
              id="deleteMessage"
              className="message message--small message--default"
            />
          </div>
          <button
            type="button"
            id="gotoAddBtn_FromReview"
            className="btn btn--secondary btn--full-width margin-top-7 btn--sm"
          >
            {" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="icon"
            >
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>{" "}
            العودة لإضافة كلمات{" "}
          </button>
        </div>
      </div>
      <button
        type="button"
        id="gotoHardWordsBtn"
        className="btn btn--fixed btn--sm hidden"
      >
        {" "}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="icon"
        >
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM5 11a1 1 0 100 2h4a1 1 0 100-2H5z" />
        </svg>{" "}
        الكلمات الصعبة{" "}
      </button>
    </div>
    <div id="globalStatus" className="message message-info">
      {" "}
      جاري التحميل...{" "}
    </div>
  </div>
</>

اصنع تطبيقا بناء على هذا الكود
  