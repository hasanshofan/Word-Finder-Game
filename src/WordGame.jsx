import React, { useState, useEffect, useCallback, useRef } from 'react';
import './WordGame.css'; 
import { s } from './dic.js';


/*version 3 - main idea compressing the Dictionary ADAPTIVE WAY*/


const ranges = {
A:[0,649],B:[649,1153],C:[1153,2080],D:[2080,2654],E:[2654,3104],F:[3104,3461],G:[3461,3749],H:[3749,4027],I:[4027,4526],J:[4526,4626],K:[4626,4701],L:[4701,5028],M:[5028,5536],N:[5536,5720],O:[5720,5964],P:[5964,6843],Q:[6843,6887],R:[6887,7318],S:[7318,8304],T:[8304,8785],U:[8785,9030],V:[9030,9140],W:[9140,9344],X:[9344,9352],Y:[9352,9377],Z:[9377,9404]
};

const WordGame = () => {
	
	//1. دالة توليد أحرف عشوائية بسيطة (خارج المكون أو داخله)
	const generateInitialLetters = () => {
  const allChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 16 }, () => 
    allChars.charAt(Math.floor(Math.random() * allChars.length))
  );
};


	const [isError, setIsError] = useState(false);
  // الأحرف الثابتة
  const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const vowels = 'aeiou'.split('');

  // حالة اللعبة (State)
  //بدلاً من مصفوفة فارغة [] في useState للاحرف، سنستخدم الدالة أعلاه:
const [letters, setLetters] = useState(generateInitialLetters());
  const [clickedIndexes, setClickedIndexes] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [allWords, setAllWords] = useState([]);
  const [scores, setScores] = useState([]);
  const [finalScore, setFinalScore] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [timeLeft, setTimeLeft] = useState(180); // 3 دقائق كبداية
  const [isGameOver, setIsGameOver] = useState(false);
  const [topScore, setTopScore] = useState(localStorage.getItem('topScore') || 0);
  const [gameActive, setGameActive] = useState(false);

  const timerRef = useRef(null);

  // دالة إنشاء لعبة جديدة 
const startNewGame = useCallback(() => {
  // 1. تحديد عدد الحروف الصامتة بناءً على الصعوبة
  let a = 11;
  switch (difficulty) {
    case 2: a = 12; break;
    case 3: a = 13; break;
    case 4: a = 14; break;
    case 5: a = 16; break;
    default: a = 11;
  }

  // 2. دالة الخلط والاقتطاع (تضمن عدم التكرار نهائياً داخل المجموعة)
  const pickUnique = (source, count) => {
    // خلط المصفوفة بالكامل عشوائياً
    let shuffled = [...source].sort(() => Math.random() - 0.5);
    // اقتطاع العدد المطلوب فقط
    return shuffled.slice(0, count).map(char => char.toUpperCase());
  };

  // 3. التنفيذ بناءً على منطق المجموعتين
  const mainChars = pickUnique(chars, a);       // سحب 'a' حرف صامت فريد
  const vowelChars = pickUnique(vowels, 16 - a); // سحب الباقي من حروف العلة فريدة

  // 4. دمج المجموعتين وخلطهم النهائي لتوزيعهم على الشبكة 4x4
  const finalGrid = [...mainChars, ...vowelChars].sort(() => Math.random() - 0.5);

  // تحديث الحالة
  setLetters(finalGrid);
  
  // تصفير الإعدادات وبدء المؤقت
  setClickedIndexes([]);
  setCurrentWord("");
  setAllWords([]);
  setScores([]);
  setFinalScore(0);
  setTimeLeft(180); 
  setIsGameOver(false);
  setGameActive(true);

  if (timerRef.current) clearInterval(timerRef.current);
  timerRef.current = setInterval(() => {
    setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
  }, 1000);
}, [difficulty, chars, vowels]);

  // مراقبة انتهاء الوقت
  useEffect(() => {
    if (timeLeft === 0 && gameActive) {
        setIsGameOver(true);
        setGameActive(false);
        if (finalScore > topScore) {
            localStorage.setItem('topScore', finalScore);
            setTopScore(finalScore);
        }
    }
  }, [timeLeft, finalScore, topScore, gameActive]);

// منطق التحقق من الكلمة (محدث بالبحث الثنائي السريع)
  const checkWord = () => {
    const word = currentWord.toUpperCase();
    if (word.length <= 2) return;

    if (allWords.includes(word)) {
        alert('Typed before');
        resetCurrentSelection();
        return;
    }
 

    const range = ranges[word[0]];
    if (range) {
        let found = false;
        
/*

// البحث الثانئي في القاموس العادي غير المختصر
      // --- بداية منطق البحث الثنائي بدلاً من Loop ---
      let left = range[0];
      let right = range[1] - 1;

      while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        let midWord = s[mid].toUpperCase(); // التأكد من تطابق الأحرف الكبيرة

        if (midWord === word) {
          found = true;
          break;
        }

        if (midWord < word) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      // --- نهاية منطق البحث الثنائي ---

*/
// --- بداية منطق البحث الثنائي المطور لنظام العناقيد (ACR Decoder) ---
let left = range[0];
let right = range[1] - 1;
let attempts = 0; 

while (left <= right) {
    attempts++; 
    let mid = Math.floor((left + right) / 2);
    let entry = s[mid]; 

    // 1. تفكيك العنقود (Cluster Decoding)
    let clusterWords = [];
    
    // فحص نوع الرابط (جذر مستقل ~ أم مجرد بادئة *)
    if (!entry.includes('*') && !entry.includes('~')) {
        // حالة كلمة مفردة لم يتم ضغطها
        clusterWords.push(entry);
    } else {
        let root = "";
        let suffixes = [];
        
        if (entry.includes('~')) {
            // الجذر هو كلمة مستقلة (ABA~CA*CK)
            const parts = entry.split('~');
            root = parts[0];
            clusterWords.push(root); // إضافة الجذر كأول كلمة
            suffixes = parts[1].split('*');
        } else {
            // الجذر مجرد بادئة (ABA*CA*CK)
            const parts = entry.split('*');
            root = parts[0];
            suffixes = parts.slice(1);
        }

        // بناء الكلمات المشتقة من السوابق
        for (let i = 0; i < suffixes.length; i++) {
            if (suffixes[i] !== "") { // تجنب السوفيكس الفارغ
                clusterWords.push(root + suffixes[i]);
            }
        }
    }

    // 2. التحقق من المطابقة (داخل العنقود)
    // نستخدم find للتحقق ما إذا كانت الكلمة المطلوبة (word) موجودة في العنقود الحالي
    if (clusterWords.includes(word)) {
        found = true;
        break;
    }

    // 3. تحديد اتجاه البحث (بناءً على آخر كلمة في العنقود لأنها الأكبر أبجدياً)
    let lastWordInCluster = clusterWords[clusterWords.length - 1];
    if (lastWordInCluster < word) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}

console.log(`الكلمة: ${word} | الحالة: ${found ? 'تم العثور عليها' : 'غير موجودة'} | عدد العمليات: ${attempts}`);
// --- نهاية منطق البحث الثنائي المطور ---




        if (found) {
            // حساب النقاط (منطقك الأصلي)
            let pts = 1;
            for (let z = 3; z < word.length; z++) pts++;
            if (word.length > 5) pts *= 2;

            setScores(prev => [...prev, pts]);
            setAllWords(prev => [...prev, word]);
            setFinalScore(prev => prev + pts);
			resetCurrentSelection();
        } else {
            // منطق الخطأ (منطقك الأصلي)
            setIsError(true);
            playErrorSound();
            setTimeout(() => {
                setIsError(false);
				resetCurrentSelection(); // التصفير يحدث هنا بعد رؤية التأثير
            }, 400);
        }
    }
    //
  };

  const playErrorSound = () => {
    const snd = new Audio("data:audio/mpeg;base64,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GGyLtEYau0v0X0Xc2YSG0CP+Vg3////////////////+VgxYBywD////////////////+VgxYBvLAOEHgAASaOVEY3hebPicZoCKZIWGYtieZ+BwZdBGahDeZvjCaYBcYSDADSaBgimIonmEgtmFw9mDItg46docVnTrxwHDAFIx4I0c40gMwe80U4HSzBDwcwGxZjlyehjwQ1dBqUGOBkwgFLC4x44xwIavgwyMGAaPBzMHHQakBqQrBA5kYMcDEqAYzA5AIDDIyCBx4HBwcELAMHBnKGj40eGg0HjR8ZBp9jQQGD1GBoOnqDR8GJ9jR4sD1Eh50gMZEHCg4QWkHQifANBOQNH1E09hgFB40HckGA3KQDwe5KjMHIBBgEMg4OT0GQaiblMkR1ZMqdIBHVUqp02E9lE09FGEAyiafKfCfaiSfKeowDg9RhAL6jCjCfPqMA0FByAeDQaCT0chy0Azlp8QYnp6fCfKiSifqMOUnt7kQc5SQLJ5KyVk6p2Q+qdHdkEnaqjo1Ry09XLUYcpyU94NcqDnIg9ynKchRhRNRJRP////////////////1ElEv////////////////UZQC+gEACTcZSJIJEABBFWNHIcMewuNXy8MvAuMQqRMJQkNhAIMqihNmCFNJwuOMCqNVhoMZEUMMyNM1TUMoBJMAVD/+9LEHwA0lg8xmd2ABj5B5Zc7oALKwcFuIyBJB7GbqoCaEc0HmFMhioqLVRi5QZiNiTEAU8wQhLWChCWCEuSLIRjpcFTkKjoCEjJCUw4BMXBxJ0FRQVCS5BWKFgUFC0ULRUJLkgkhHRYRB5gIePF4MDiwEvgLFJYCEjhYSHBdAIDgMGg4iBh4CHAcSDRIeEgAsACV4sIioS+CSaSQqEptDQmWQVWLfDQgpwqslUYOAJUCQ+lWIw4cAFOEVkCKnCBJFZAh6BIrAB4BbM0wrABIBaUuxSIsICwmWBQuUkiLCSR6Rj5qqoEFV0CaqqjUHoE1G1VYORWQaVgQiQaQIIrqNIEC3aqqAVs6ARpg4Av8oyVgCVahskURTafFnCiCbSbfpIptM6URZym37OEj022cs7Z2m2+aiLO3wURURfJ8xYRSQSPSRSSSRSPZ2kYkazlRFJBNpnb5vm+L4f///////////////vm+T4vn///////////////++b5vgBAAAAAbMUMZjmMbfsIZ2GMWNrMCSgNCAvMJSXNHAvMlx6M4heM4gdMdgJMXxeMCS0AAvGHIcmFw0AN8elKVpTlOAYAMDDAEM4SUbCGShIERsoAZRrzg1xNekGJRZIaunCJhVIYg4AnIDDBBMyQgI5jLlyCsSEJjJiQokLCQKnAggEOBlKMuBgQNcRpM5IQlCCAQSGUkHoMDRAIcgAmFCSqgwcVUCE5YOBUkrCVkiwdUaVjCCQVEqqKrgAkg0EEhpIW9g8ITBBJFQITorlglBo0RRUcsZEQaNECwJcpWMaIFuSwJLcKxlv0VFORokViAgkio5A0TRULAhRtTlFYsCXIKxCjSjblOSioo25Rb1Bly1YUG0CLkIRqxwarGW+g4t2rGgwgRVhViVhg5WNWNFZAi5CBJAgo3B6sKqiq6sSq7lKqoRKqoEXLctVdVWD1YnKcuD3KVXclCBBhAjBqsSsKq6nKsCBFVX1YXJcv0CSBD/////////////////QJ/////////////////6BL0CNUFtAAA01CaIyhNA1DXIyWMYxDpkwIKoyWEMyFEMIRwYGgxUCQygGkKDiYEiEYcDUYWi8YckEYQB//70sQcADIODzC53YAGTMXlgzugAANLphJwAtA1Q5K4I2sIMJJRkuRVBCmZYWApbMADlGB53KzgZQ4NGjoISyyJhISEEwCSBgSLJhBwFBwt0AhFRsBCIVExkJMICSsdMJCAoOFgdcgaEgAJlgSLJhBMWTLcFvSwJFvy3hbxRot4qsECQ0SlvkVkCQ0IDAS5SEaETluSW9GAhVYaEhoRGAlBsrEy36KgQJlvywEIEVOFOFGoPU5UbgxyYMU4Lfor+gTRWLdoqoElYVGkCKKqnKKqDLlIElYVGoNU5VX9WFWBVZRpykCaBBFRTlFRRpThThRtFRTkrCFOS3CBJFcsBCKyK6BAt0o25KsajblKwKNKNqcqNuQqr6sSjUGIE4OUbg+DXLg2D3KUacuDlOPgxRpBpRtWNCJWFRtTlAkqvBqnCK6jajSnCK6jajX///////////////6nCjSjSK3///////////////6nKjajRug3xm2lxsLKxm0qxuVG5lYTBjgL4025gkFxkcKhjiCRggEpiGUI0CJiUIZiGHJg2MxhSE4D6nwJDb04a8qgRU4WNBuSYSWATczp0MdDEMUOizQ0p0YlKwDUkziQIdmcOBDUQkRQyZIMLNjEpRgmYkkEJCwcMQaRUCGwY5Cp1UYoIBxdLpaiDYCJAImABLkjRELnS34CbDJosmEJCEiqcSGoNq3iwBBgtyqsgTLdKxIMgJKWCRYEBhIIIjBMZEiw5byghQHLjQlDnByKqqhYE+rEqoqs5LljRJBpFdWAaIoNKqKcqXKwqrseLorWSKkKsSnKjcGKcKwKNKcqcqrqNQcp5aLlwatdylY3IVgcpyEhnZg9MZKl3WdK2sKhp2VOEG1G1YlYFGoNU5ctVVyVOFGoNcqDXIg1T7kuW5K13KVUg9TzkuRB60mBPvYXMslyI8z1hExE1OoMgdAmgQ/////////////////0CaBFAii7z///////////////omRJPkwFtXzfiTSOHKKRxSin5ZRT8sVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQAAAAIIAADk17WOE1IF2np/zOyXQMWIpl9Mv8yQg+zB/EIq//vSxBGAKlG+7RnugAAAADSDgAAE3P81qnMHaLjz/MGTTNXpLNWBK/HX/5BGpxlwZuAehkpheeOs///NkKBNKDGMYpFNVodM3DIx1njr///MQGZM3lhMdiMMTmPM0FHMYCMzx1njr///8xeZszGTMxGJQxcZkysQswyIgxQXHeOt463////5kscZgMQxjQwJkocJgUQxicr5jMTYXGwxISvHW8db3rf/////5icN5gqMxiMiZhgIpgyKBhUZpekwlDAwWH8LgwYchN+t////////////+YODeBQkMOwcMJBxMAwiMJwQIALMNRoHh3LASGHo6GHIAkoeGGo2ERFf///////////////////ggADEUcAKGZh+bBjeXhiaF4NJYw5GQwTCEwHHYwtFIwJBswFGgwnEgwFBcwFGIwlEIwBBUwFF5UxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=") // نفس الصوت الطويل
    snd.play();
  };

  const resetCurrentSelection = () => {
    setClickedIndexes([]);
    setCurrentWord("");
  };

  const handleLetterClick = (char, index) => {
    if (clickedIndexes.includes(index)) return;
    setClickedIndexes(prev => [...prev, index]);
    setCurrentWord(prev => prev + char);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `Time: ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

// الـ Hook داخل المكون لضمان ملاحقة السكرول للكلمات الجديدة
useEffect(() => {
  const wordBox = document.querySelector('textarea');
  if (wordBox) wordBox.scrollTop = wordBox.scrollHeight;
}, [allWords]);

  return (
    <div className="game-wrapper">
      {/* نافذة النتيجة النهائية */}
{isGameOver && (
  <div id="score_panel" style={{ display: 'flex' }}>
    <div className="score-card">
      <h2>Game Over!</h2>
      <p>Your Final Score</p>
      <span className="final-number">{finalScore}</span>
      
      <button 
        onClick={() => setIsGameOver(false)} 
        style={{
          background: '#8bc34a',
          color: 'white',
          marginTop: '20px',
          width: '100%'
        }}
      >
        Close & View Words
      </button>
      
      <button 
        onClick={() => {
          setIsGameOver(false);
          startNewGame();
        }}
        style={{
          background: '#2196F3',
          color: 'white',
          marginTop: '10px',
          width: '100%'
        }}
      >
        Play Again
      </button>
    </div>
  </div>
)}

      <div className="container">
        <div className="first-r">
          <div className="container-box second-r" style={{borderRadius: '5px 0 0 0'}}>
            <span>Difficulty</span>
            <input 
                type="range" 
                min="20" max="100" step="20"
                value={difficulty * 20} 
                onChange={(e) => setDifficulty(Math.round(e.target.value / 20))}
            />
            <span>{difficulty}</span>
            <span id='timer_box'>{formatTime(timeLeft)}</span>
          </div>

          <div className="container-box second-r" style={{borderRadius: '0 5px 0 0'}}>
            <button id='new_game_button' onClick={startNewGame} disabled={gameActive}>New Game</button>
            <div id='topScore'>Top Score: {topScore}</div>
          </div>
        </div>

        <div style={{display: 'flex', width: '100%', justifyContent: 'space-between'}}>
          <div id='letters'>
            {letters.map((char, idx) => (
              <span 
                key={idx} 
className={`${isError && clickedIndexes.includes(idx) ? 'shake-skew' : (clickedIndexes.includes(idx) ? 'clicked' : '')} ${!gameActive ? 'idle-letter' : ''}`}
                onClick={() => handleLetterClick(char, idx)}
              >
                {char}
              </span>
            ))}
          </div>

          <div className="container-box" style={{borderRadius: '0 0 5px 0'}}>
            <div className='new'>
              <div>word</div>
              <div>points</div>
            </div>
            <div className='words-table'>
              <textarea readOnly value={allWords.map((w, i) => `${i+1}. ${w}`).join('\n')}></textarea>
              <textarea readOnly value={scores.join('\n')}></textarea>
            </div>
            <div id='result'>{currentWord}</div>
            <div className='new'>
              <button onClick={resetCurrentSelection}>Retry</button>
              <button onClick={checkWord} disabled={!gameActive}>Enter</button>
            </div>
          </div>
        </div>
      </div>
	  <footer className="game-footer">
    <a 
        href="https://github.com/hasanshofan/Word-Finder-Game" 
        target="_blank" 
        rel="noopener noreferrer"
        className="github-link"
    >
        <i className="fab fa-github"></i> View Source Code on GitHub
    </a>
</footer>
    </div>
  );
};

export default WordGame;