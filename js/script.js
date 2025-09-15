// Объект для хранения изученных слов
let learnedWords = {};
let currentSpeechUtterance = null;
let currentPage = 1;
const wordsPerPage = 10;

// Функция для отображения слов
function renderWords(wordsToRender, page = 1) {
    const wordsContainer = document.querySelector('.words-container');
    wordsContainer.innerHTML = '';
    
    // Вычисляем индексы для текущей страницы
    const startIndex = (page - 1) * wordsPerPage;
    const endIndex = Math.min(startIndex + wordsPerPage, wordsToRender.length);
    const wordsForPage = wordsToRender.slice(startIndex, endIndex);
    
    // Обновляем счетчик
    document.getElementById('word-count').textContent = wordsToRender.length;
    document.getElementById('current-page').textContent = page;
    document.getElementById('total-pages').textContent = Math.ceil(wordsToRender.length / wordsPerPage);
    
    // Обновляем пагинацию
    updatePagination(wordsToRender.length, page);
    
    wordsForPage.forEach(item => {
        const isLearned = learnedWords[item.word];
        const wordCard = document.createElement('div');
        wordCard.className = `word-card ${isLearned ? 'learned' : ''}`;
        
        wordCard.innerHTML = `
            <input type="checkbox" class="learned-checkbox" ${isLearned ? 'checked' : ''} data-word="${item.word}">
            <div class="card-inner">
                <div class="card-front">
                    <div class="word">${item.word}</div>
                    <button class="audio-btn" data-word="${item.word.replace(/'/g, "\\'")}">
                        <span class="icon">🔊</span> Произношение
                    </button>
                    <button class="flip-btn">Показать перевод</button>
                </div>
                <div class="card-back">
                    <div class="translation">${item.translation}</div>
                    <button class="flip-btn">Показать слово</button>
                </div>
            </div>
            <div class="category">${item.category}</div>
        `;
        
        wordsContainer.appendChild(wordCard);
    });
    
    // Обновляем счетчик изученных слов
    updateLearnedCounter();
    
    // Добавляем обработчики событий
    addEventListeners();
}

// Функция для обновления пагинации
function updatePagination(totalWords, currentPage) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    
    const totalPages = Math.ceil(totalWords / wordsPerPage);
    
    // Кнопка "Назад"
    const prevButton = document.createElement('button');
    prevButton.className = 'page-btn';
    prevButton.innerHTML = '&laquo;';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            renderWords(getFilteredWords(), currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Кнопки страниц
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            renderWords(getFilteredWords(), i);
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // Кнопка "Вперед"
    const nextButton = document.createElement('button');
    nextButton.className = 'page-btn';
    nextButton.innerHTML = '&raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderWords(getFilteredWords(), currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Функция для получения отфильтрованных слов
function getFilteredWords() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
    
    return words.filter(item => {
        const matchesSearch = item.word.toLowerCase().includes(searchTerm) || 
                             item.translation.toLowerCase().includes(searchTerm);
        const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });
}

// Функция для произношения слова (использует Web Speech API)
function speakWord(word) {
    // Останавливаем любое текущее произношение
    if (currentSpeechUtterance) {
        window.speechSynthesis.cancel();
        const currentButton = document.querySelector('.audio-btn.playing');
        if (currentButton) {
            currentButton.classList.remove('playing');
        }
    }
    
    // Добавляем визуальную индикацию
    const buttons = document.querySelectorAll('.audio-btn');
    buttons.forEach(btn => {
        if (btn.dataset.word === word) {
            btn.classList.add('playing');
        }
    });
    
    if ('speechSynthesis' in window) {
        try {
            currentSpeechUtterance = new SpeechSynthesisUtterance(word);
            currentSpeechUtterance.lang = 'en-US';
            currentSpeechUtterance.rate = 0.8;
            
            currentSpeechUtterance.onend = function() {
                const buttons = document.querySelectorAll('.audio-btn');
                buttons.forEach(btn => {
                    if (btn.dataset.word === word) {
                        btn.classList.remove('playing');
                    }
                });
                currentSpeechUtterance = null;
            };
            
            currentSpeechUtterance.onerror = function() {
                const buttons = document.querySelectorAll('.audio-btn');
                buttons.forEach(btn => {
                    if (btn.dataset.word === word) {
                        btn.classList.remove('playing');
                    }
                });
                showNotification('Ошибка воспроизведения. Проверьте поддержку синтеза речи в вашем браузере.', true);
                currentSpeechUtterance = null;
            };
            
            window.speechSynthesis.speak(currentSpeechUtterance);
        } catch (error) {
            showNotification('Ошибка при воспроизведении слова', true);
            console.error('Speech synthesis error:', error);
        }
    } else {
        showNotification('Ваш браузер не поддерживает функцию произношения', true);
    }
}

// Функция для показа уведомления
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.toggle('error', isError);
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Функция для обновления счетчика изученных слов
function updateLearnedCounter() {
    const learnedCount = Object.keys(learnedWords).length;
    document.getElementById('learned-count').textContent = learnedCount;
    document.getElementById('total-count').textContent = words.length;
    
    // Обновляем прогресс-бар
    const progressPercent = (learnedCount / words.length) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
}

// Функция для добавления обработчиков событий
function addEventListeners() {
    // Обработчики для кнопок произношения
    document.querySelectorAll('.audio-btn').forEach(button => {
        button.addEventListener('click', function() {
            speakWord(this.dataset.word);
        });
    });
    
    // Обработчики для кнопок переворота карточки
    document.querySelectorAll('.flip-btn').forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.word-card');
            card.classList.toggle('flipped');
            
            // Обновляем текст кнопки
            if (card.classList.contains('flipped')) {
                if (this.textContent === 'Показать перевод') {
                    this.textContent = 'Показать слово';
                }
            } else {
                if (this.textContent === 'Показать слово') {
                    this.textContent = 'Показать перевод';
                }
            }
        });
    });
    
    // Обработчики для чекбоксов изученных слов
    document.querySelectorAll('.learned-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const word = this.dataset.word;
            if (this.checked) {
                learnedWords[word] = true;
                this.parentElement.classList.add('learned');
                showNotification('Слово отмечено как изученное!');
            } else {
                delete learnedWords[word];
                this.parentElement.classList.remove('learned');
            }
            
            // Сохраняем в localStorage
            localStorage.setItem('learnedWords', JSON.stringify(learnedWords));
            
            // Обновляем счетчик
            updateLearnedCounter();
        });
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем изученные слова из localStorage
    const savedLearnedWords = localStorage.getItem('learnedWords');
    if (savedLearnedWords) {
        learnedWords = JSON.parse(savedLearnedWords);
    }
    
    renderWords(words, currentPage);
    
    // Поиск слов
    document.getElementById('search').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
        
        // Показываем/скрываем кнопку очистки
        document.getElementById('search-clear').classList.toggle('visible', searchTerm.length > 0);
        
        const filteredWords = words.filter(item => {
            const matchesSearch = item.word.toLowerCase().includes(searchTerm) || 
                                 item.translation.toLowerCase().includes(searchTerm);
            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
        
        renderWords(filteredWords, 1);
    });
    
    // Очистка поиска
    document.getElementById('search-clear').addEventListener('click', function() {
        document.getElementById('search').value = '';
        this.classList.remove('visible');
        
        const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
        const filteredWords = activeCategory === 'all' 
            ? words 
            : words.filter(item => item.category === activeCategory);
        
        renderWords(filteredWords, 1);
    });
    
    // Фильтрация по категориям
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            const searchTerm = document.getElementById('search').value.toLowerCase();
            
            const filteredWords = words.filter(item => {
                const matchesSearch = item.word.toLowerCase().includes(searchTerm) || 
                                     item.translation.toLowerCase().includes(searchTerm);
                const matchesCategory = category === 'all' || item.category === category;
                return matchesSearch && matchesCategory;
            });
            
            renderWords(filteredWords, 1);
        });
    });
});
