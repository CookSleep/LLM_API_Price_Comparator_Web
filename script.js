let exchangeRate = null;
let navigationArray = [];
let animationQueue = [];
let isAnimating = false;
let resultsContainerHeight = 0;

document.addEventListener('DOMContentLoaded', function() {
    adjustFrameHeights(); 
    setupKeyboardNavigation();
    setupWheelSelection();
    getExchangeRate();
    document.getElementById('calculateBtn').addEventListener('click', calculateCosts);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllData);
    document.getElementById('addProviderBtn').addEventListener('click', () => addProviderRow(true));
    ensureMinimumRows();
    updateNavigationArray();

    const infoIcon = document.querySelector('.info-icon');
    const tooltip = document.querySelector('.tooltip');
    
    infoIcon.addEventListener('mouseenter', showTooltip);
    infoIcon.addEventListener('mouseleave', hideTooltip);
    infoIcon.addEventListener('touchstart', toggleTooltip);

    window.addEventListener('resize', positionTooltip);

    document.addEventListener('touchstart', function(e) {
        if (!tooltip.contains(e.target) && !infoIcon.contains(e.target)) {
            hideTooltip();
        }
    });

    const resultsContainer = document.querySelector('.results');
    resultsContainerHeight = resultsContainer.offsetHeight;
});

function showTooltip() {
    const tooltip = document.querySelector('.tooltip');
    tooltip.style.display = 'block';
    positionTooltip();
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    tooltip.style.display = 'none';
}

function positionTooltip() {
    const tooltip = document.querySelector('.tooltip');
    const infoIcon = document.querySelector('.info-icon');
    const iconRect = infoIcon.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = iconRect.left + (iconRect.width / 2) - (tooltipRect.width / 2);
    let top = iconRect.bottom + window.scrollY;

    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }

    tooltip.style.position = 'absolute';
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

function toggleTooltip(e) {
    e.preventDefault();
    const tooltip = document.querySelector('.tooltip');
    if (tooltip.style.display === 'none' || tooltip.style.display === '') {
        showTooltip();
    } else {
        hideTooltip();
    }
}

function ensureMinimumRows() {
    const tbody = document.querySelector('#providersTable tbody');
    while (tbody.children.length < 2) {
        addProviderRow(false);
    }
    updateNavigationArray();
    adjustFrameHeights();
}

function getExchangeRate() {
    const exchangeRateValue = document.getElementById('exchangeRateValue');
    exchangeRateValue.textContent = '获取中...';
    exchangeRateValue.className = 'loading';

    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const url = isLocalHost ? 'mock_exchange_rate.json' : 'exchange_rate.json';

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            exchangeRate = parseFloat(data.exchangeRate);
            exchangeRateValue.textContent = exchangeRate.toFixed(4);
            exchangeRateValue.className = '';
        })
        .catch(error => {
            console.error('获取汇率失败:', error);
            exchangeRateValue.textContent = '获取失败';
            exchangeRateValue.className = 'error';
        });
}

function calculateCosts() {
    if (!exchangeRate) {
        showCustomAlert('汇率获取失败，\n可能是GItHub Action故障。');
        return;
    }

    clearErrors();
    if (!validateInputs()) return;

    const inputTokens = parseFloat(document.getElementById('inputtokens').value) || 0;
    const outputTokens = parseFloat(document.getElementById('outputtokens').value) || 0;
    const tokenUnitValue = parseFloat(document.getElementById('tokenunit').value);
    const inputTokensInBaseUnit = inputTokens * tokenUnitValue;
    const outputTokensInBaseUnit = outputTokens * tokenUnitValue;

    const results = calculateProviderCosts(inputTokensInBaseUnit, outputTokensInBaseUnit);
    displayResults(results);
}

function calculateProviderCosts(inputTokensInBaseUnit, outputTokensInBaseUnit) {
    return Array.from(document.querySelectorAll('#providersTable tbody tr'))
        .map(row => calculateProviderCost(row, inputTokensInBaseUnit, outputTokensInBaseUnit))
        .filter(result => result !== null);
}

function calculateProviderCost(row, inputTokensInBaseUnit, outputTokensInBaseUnit) {
    try {
        const providerName = row.querySelector('.provider-name').value;
        const rechargeAmount = parseFloat(row.querySelector('.recharge-amount').value);
        const currency = row.querySelector('.currency').value;
        const balance = parseFloat(row.querySelector('.balance').value);
        const inputPrice = parseFloat(row.querySelector('.input-price').value);
        const samePrice = row.querySelector('.same-price').checked;
        const outputPrice = samePrice ? inputPrice : parseFloat(row.querySelector('.output-price').value);
        const tokenUnit = parseFloat(row.querySelector('.token-unit').value);

        let rechargeAmountCNY = rechargeAmount;
        if (currency === 'USD') {
            rechargeAmountCNY *= exchangeRate;
        }

        const costPerTokenInput = (rechargeAmountCNY / balance) * inputPrice / tokenUnit;
        const costPerTokenOutput = (rechargeAmountCNY / balance) * outputPrice / tokenUnit;

        const totalCostCNY = (costPerTokenInput * inputTokensInBaseUnit + costPerTokenOutput * outputTokensInBaseUnit) / tokenUnit;
        const totalCostUSD = totalCostCNY / exchangeRate;

        return { name: providerName, costCNY: totalCostCNY, costUSD: totalCostUSD };
    } catch (error) {
        console.error(`计算错误: ${error.message}`);
        return null;
    }
}

function displayResults(results) {
    results.sort((a, b) => a.costCNY - b.costCNY);
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';

    const resultsContainer = document.querySelector('.results');
    const originalHeight = resultsContainer.scrollHeight;

    const fragment = document.createDocumentFragment();

    results.forEach((r, index) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.style.opacity = '0';
        resultItem.style.transform = 'translateY(20px)';
        resultItem.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="provider">${r.name}</span>
            <span class="cost">${r.costCNY.toFixed(4)} CNY / ${r.costUSD.toFixed(4)} USD</span>
        `;
        fragment.appendChild(resultItem);
    });

    resultsList.appendChild(fragment);
    
    const newHeight = resultsList.scrollHeight;

    animateResultsContainer(originalHeight, newHeight, () => {
        const resultItems = resultsList.querySelectorAll('.result-item');
        resultItems.forEach((item, index) => {
            item.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        });
    });

    adjustResultsContainerHeight(resultsContainer);
}

function adjustResultsContainerHeight(container) {
    const content = container.innerHTML;
    const tempDiv = document.createElement('div');
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.width = container.clientWidth + 'px';
    tempDiv.innerHTML = content;
    document.body.appendChild(tempDiv);

    const height = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);

    container.style.height = height + 'px';
}

function animateResultsContainer(fromHeight, toHeight, callback) {
    const resultsContainer = document.querySelector('.results');
    resultsContainer.style.height = `${fromHeight}px`;
    resultsContainer.style.transition = 'height 0.5s ease-in-out';

    requestAnimationFrame(() => {
        resultsContainer.style.height = `${toHeight}px`;
    });

    const transitionEndHandler = () => {
        resultsContainer.style.height = 'auto';
        resultsContainer.style.transition = '';
        if (callback) callback();
        resultsContainer.removeEventListener('transitionend', transitionEndHandler);
    };

    resultsContainer.addEventListener('transitionend', transitionEndHandler);
}

function clearAllData() {
    showCustomAlert('确定要清除所有数据吗？').then((confirmed) => {
        if (confirmed) {
            const rows = document.querySelectorAll('#providersTable tbody tr');
            const resultsList = document.getElementById('results-list');
            const resultItems = resultsList.querySelectorAll('.result-item');

            clearResultsList(resultsList, resultItems).then(() => {
                return clearAllRows(rows);
            }).then(() => {
                document.getElementById('inputtokens').value = '';
                document.getElementById('outputtokens').value = '';
                document.getElementById('tokenunit').selectedIndex = 0;
                clearErrors();
                ensureMinimumRows();
                updateNavigationArray();
                adjustFrameHeights();
            });
        }
    });
}

function clearResultsList(container, items) {
    return new Promise((resolve) => {
        if (items.length === 0) {
            resolve();
            return;
        }

        items.forEach((item, index) => {
            item.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
        });

        setTimeout(() => {
            container.innerHTML = '';
            resolve();
        }, 500 + items.length * 0.05 * 1000);
    });
}

function clearAllRows(rows) {
    return new Promise((resolve) => {
        if (rows.length === 0) {
            resolve();
            return;
        }

        const tableContainer = document.querySelector('.table-container');
        const tbody = document.querySelector('#providersTable tbody');

        for (let i = 0; i < Math.min(2, rows.length); i++) {
            clearRowData(rows[i]);
            rows[i].classList.add('collapse-row');
            setTimeout(() => {
                rows[i].classList.remove('collapse-row');
                rows[i].classList.add('expand-row');
            }, 500);
        }

        for (let i = 2; i < rows.length; i++) {
            rows[i].classList.add('collapse-row');
        }

        const newHeight = rows[0].offsetHeight * 2;

        tableContainer.style.transition = 'height 0.5s ease-in-out';
        tableContainer.style.height = `${newHeight}px`;

        setTimeout(() => {
            for (let i = rows.length - 1; i >= 2; i--) {
                tbody.removeChild(rows[i]);
            }
            tableContainer.style.transition = '';
            resolve();
        }, 500);
    });
}

function clearRowData(row) {
    row.querySelectorAll('input, select').forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else if (input.tagName === 'SELECT') {
            input.selectedIndex = 0;
        } else {
            input.value = '';
        }
        input.disabled = false;
        input.style.backgroundColor = '';
    });
    toggleOutputPrice(row, false);
}

function validateInputs() {
    let isValid = true;
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        if (input.value.trim() === '' && !input.disabled) {
            input.classList.add('error');
            isValid = false;
        }
    });
    return isValid;
}

function clearErrors() {
    const inputs = document.querySelectorAll('.error');
    inputs.forEach(input => input.classList.remove('error'));
}

function updateNavigationArray() {
    navigationArray = [
        [document.getElementById('inputtokens')],
        [document.getElementById('outputtokens')],
        [document.getElementById('tokenunit')]
    ];

    const rows = document.querySelectorAll('#providersTable tbody tr');
    rows.forEach(row => {
        const rowElements = row.querySelectorAll('input:not([type="checkbox"]), select');
        navigationArray.push(Array.from(rowElements));
    });
}

function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        const currentElement = document.activeElement;
        if (!isNavigableElement(currentElement)) return;

        let nextElement;

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                nextElement = findNextElement(currentElement, 'up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                nextElement = findNextElement(currentElement, 'down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                nextElement = findNextElement(currentElement, 'left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextElement = findNextElement(currentElement, 'right');
                break;
            case 'Enter':
                if (currentElement.tagName === 'SELECT') {
                    return;
                }
                e.preventDefault();
                handleEnterKey(currentElement);
                return;
        }

        if (nextElement && nextElement !== currentElement) {
            nextElement.focus();
        }
    });
}

function setupWheelSelection() {
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('wheel', function(e) {
            e.preventDefault();
            const options = this.options;
            const index = this.selectedIndex;
            if (e.deltaY < 0 && index > 0) {
                this.selectedIndex = index - 1;
            } else if (e.deltaY > 0 && index < options.length - 1) {
                this.selectedIndex = index + 1;
            }
        });
    });
}

function isNavigableElement(element) {
    return element && (
        element.tagName === 'INPUT' ||
        element.tagName === 'SELECT'
    );
}

function findNextElement(currentElement, direction) {
    const currentPosition = findElementPosition(currentElement);
    if (!currentPosition) return currentElement;

    let {row, col} = currentPosition;

    switch (direction) {
        case 'up':
            if (row > 0) {
                row--;
            }
            break;
        case 'down':
            if (row < navigationArray.length - 1) {
                row++;
            }
            break;
        case 'left':
            if (col > 0) {
                col--;
            }
            break;
        case 'right':
            if (col < navigationArray[row].length - 1) {
                col++;
            }
            break;
    }

    return navigationArray[row][col] || currentElement;
}

function findElementPosition(element) {
    for (let i = 0; i < navigationArray.length; i++) {
        const j = navigationArray[i].indexOf(element);
        if (j !== -1) {
            return {row: i, col: j};
        }
    }
    return null;
}

function handleEnterKey(element) {
    if (element.id === 'calculateBtn') {
        calculateCosts();
    } else if (element.id === 'clearAllBtn') {
        clearAllData();
    } else if (element.id === 'alertConfirm') {
        closeCustomAlert();
    }
}

function addProviderRow(updateFrameHeights = true) {
    const tbody = document.querySelector('#providersTable tbody');
    const row = document.createElement('tr');
    row.classList.add('expand-row');
    row.innerHTML = `
        <td><input type="text" class="provider-name" placeholder="服务商名称"></td>
        <td><input type="number" class="recharge-amount" placeholder="仅数字" step="any"></td>
        <td>
            <select class="currency">
                <option value="CNY">CNY</option>
                <option value="USD">USD</option>
            </select>
        </td>
        <td><input type="number" class="balance" placeholder="仅数字" step="any"></td>
        <td><input type="number" class="input-price" placeholder="仅数字" step="any"></td>
        <td><input type="number" class="output-price" placeholder="仅数字" step="any"></td>
        <td>
            <label class="switch">
                <input type="checkbox" class="same-price">
                <span class="slider"></span>
            </label>
        </td>
        <td>
            <select class="token-unit">
                <option value="1000">K</option>
                <option value="1000000">M</option>
            </select>
        </td>
        <td>
            <button class="delete-row">
                <svg class="icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            </button>
        </td>
    `;

    tbody.appendChild(row);

    row.querySelector('.delete-row').addEventListener('click', function() {
        deleteRow(row);
    });

    row.querySelector('.same-price').addEventListener('change', function(e) {
        toggleOutputPrice(row, e.target.checked);
    });

    updateNavigationArray();
    setupWheelSelection();

    if (updateFrameHeights) {
        enqueueAnimation(() => adjustTableContainerHeight(row.offsetHeight, 500));
    }
}

function deleteRow(row) {
    const tbody = row.parentNode;
    const rows = Array.from(tbody.children);
    const rowIndex = rows.indexOf(row);

    if (rows.length > 1) {
        const rowHeight = row.offsetHeight;

        row.classList.remove('expand-row');
        row.classList.add('collapse-row');

        enqueueAnimation(() => adjustTableContainerHeight(-rowHeight, 500, () => {
            if (rows.length > 1) {
                tbody.removeChild(row);
            } else {
                clearRowData(row);
            }
            updateNavigationArray();
        }));
    } else {
        clearRowData(row);
    }
}

function adjustTableContainerHeight(heightChange, duration, callback) {
    const tableContainer = document.querySelector('.table-container');
    const newHeight = tableContainer.offsetHeight + heightChange;
    tableContainer.style.transition = `height ${duration}ms ease-in-out`;
    tableContainer.style.height = `${newHeight}px`;

    setTimeout(() => {
        tableContainer.style.transition = '';
        if (callback) callback();
        playNextAnimation();
    }, duration);
}

function enqueueAnimation(animation) {
    animationQueue.push(animation);
    if (!isAnimating) {
        playNextAnimation();
    }
}

function playNextAnimation() {
    if (animationQueue.length > 0) {
        isAnimating = true;
        const nextAnimation = animationQueue.shift();
        nextAnimation();
    } else {
        isAnimating = false;
    }
}

function showCustomAlert(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customAlert');
        const alertMessage = document.getElementById('alertMessage');
        const confirmButton = document.getElementById('alertConfirm');
        const cancelButton = document.getElementById('alertCancel');

        alertMessage.innerHTML = message.replace(/\n/g, '<br>');
        modal.style.display = 'flex';

        const closeModal = (result) => {
            modal.style.display = 'none';
            resolve(result);
        };

        confirmButton.onclick = () => closeModal(true);
        cancelButton.onclick = () => closeModal(false);

        const handleKeyDown = function(e) {
            if (e.key === 'Enter' && modal.style.display === 'flex') {
                e.preventDefault();
                closeModal(true);
            } else if (e.key === 'Escape' && modal.style.display === 'flex') {
                e.preventDefault();
                closeModal(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        modal.onclose = () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    });
}

function toggleOutputPrice(row, isChecked) {
    const outputPrice = row.querySelector('.output-price');
    const inputPrice = row.querySelector('.input-price');
    outputPrice.disabled = isChecked;
    outputPrice.style.backgroundColor = isChecked ? '#f0f0f0' : '';
    if (isChecked) {
        outputPrice.value = inputPrice.value;
    }
}

function adjustFrameHeights() {
    const tableContainer = document.querySelector('.table-container');
    const tbody = document.querySelector('#providersTable tbody');
    const resultsContainer = document.querySelector('.results');

    tableContainer.style.height = `${tbody.scrollHeight + 50}px`;

    if (resultsContainer.children.length > 2) {
        resultsContainer.style.height = `${resultsContainerHeight}px`;
    } else {
        resultsContainer.style.height = 'auto';
        resultsContainerHeight = resultsContainer.offsetHeight;
    }
}

window.addEventListener('load', () => {
    const resultsContainer = document.querySelector('.results');
    resultsContainerHeight = resultsContainer.offsetHeight;
    adjustFrameHeights();
});

function onAnimationEnd(element, callback) {
    const animationEndEvents = ['animationend', 'webkitAnimationEnd', 'oAnimationEnd', 'MSAnimationEnd'];
    
    function handleAnimationEnd() {
        animationEndEvents.forEach(event => {
            element.removeEventListener(event, handleAnimationEnd);
        });
        callback();
    }

    animationEndEvents.forEach(event => {
        element.addEventListener(event, handleAnimationEnd);
    });
}

adjustFrameHeights();
