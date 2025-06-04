// 预设表单数据
const presetFormData = {
    token: {
        input: 1769,
        output: 246
    },
    services: [
        {
            name: "A",
            recharge_amount: 1,
            currency: "USD",
            balance: 1,
            input_price: 12.5,
            output_price: 5,
            unified_io: false,
            token_unit: "M"
        },
        {
            name: "B",
            recharge_amount: 1.5,
            currency: "CNY",
            balance: 1,
            input_price: 0.1,
            output_price: 0.1,
            unified_io: true,
            token_unit: "K"
        },
        {
            name: "C",
            recharge_amount: 5.49,
            currency: "USD",
            balance: 5,
            input_price: 0.015,
            output_price: 0.075,
            unified_io: false,
            token_unit: "K"
        }
    ]
};

// 表单模态框功能实现
// 只暴露弹窗相关函数，不直接绑定按钮事件
window.openSaveFormModal = openSaveFormModal;
window.openHistoryFormModal = openHistoryFormModal;

// 初始化模态框和预设表单
initFormModal();
addPresetFormToStorage();

// 初始化表单模态框
function initFormModal() {
    // 直接绑定事件（DOM已在index.html中）
    setupSaveFormModalEvents();
    setupHistoryFormModalEvents();
}

// 设置保存表单模态框事件
function setupSaveFormModalEvents() {
    const modal = document.getElementById('saveFormModal');
    const closeBtn = modal.querySelector('.close-btn');
    const saveBtn = document.getElementById('saveFormConfirm');
    
    // 关闭按钮事件
    closeBtn.addEventListener('click', () => {
        console.log('点击保存表单弹窗关闭按钮');
        closeSaveFormModal();
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            console.log('点击保存表单弹窗外部关闭');
            closeSaveFormModal();
        }
    });
    
    // 保存表单按钮事件
    saveBtn.addEventListener('click', () => {
        console.log('点击保存表单按钮');
        saveFormWithName();
    });
    
    // 表单名称输入框支持Enter触发保存
    const formNameInput = document.getElementById('formName');
    if (formNameInput) {
        formNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('回车保存表单');
                saveFormWithName();
            }
        });
    }
}

// 设置历史记录模态框事件
function setupHistoryFormModalEvents() {
    const modal = document.getElementById('historyFormModal');
    const closeBtn = modal.querySelector('.close-btn');
    
    // 关闭按钮事件
    closeBtn.addEventListener('click', () => {
        console.log('点击历史记录弹窗关闭按钮');
        closeHistoryFormModal();
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            console.log('点击历史记录弹窗外部关闭');
            closeHistoryFormModal();
        }
    });
}

// 打开保存表单模态框
function openSaveFormModal() {
    const modal = document.getElementById('saveFormModal');
    document.getElementById('formName').value = '';
    modal.style.display = 'flex';
}

// 关闭保存表单模态框
function closeSaveFormModal() {
    const modal = document.getElementById('saveFormModal');
    modal.style.display = 'none';
    document.getElementById('formName').value = '';
}

// 打开历史记录模态框
function openHistoryFormModal() {
    const modal = document.getElementById('historyFormModal');
    const formList = document.getElementById('formList');
    const noFormsMessage = document.getElementById('noFormsMessage');
    
    // 清空表单列表
    formList.innerHTML = '';
    
    // 加载已保存的表单
    const forms = JSON.parse(localStorage.getItem('formHistory') || '[]');
    
    if (forms.length > 0) {
        forms.forEach((form, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="form-name">${form.name}</div>
                <button class="delete-btn" data-index="${index}">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            `;
            
            // 添加点击加载事件
            li.addEventListener('click', (e) => {
                // 如果点击的是删除按钮或其子元素，不触发加载
                if (e.target.closest('.delete-btn')) {
                    return;
                }
                loadForm(index);
            });
            
            formList.appendChild(li);
        });
        
        // 绑定删除按钮事件
        formList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡到列表项
                const index = e.currentTarget.getAttribute('data-index');
                deleteForm(index);
            });
        });
        
        // 显示表单列表，隐藏无表单消息
        formList.style.display = 'block';
        noFormsMessage.style.display = 'none';
    } else {
        // 隐藏表单列表，显示无表单消息
        formList.style.display = 'none';
        noFormsMessage.style.display = 'block';
    }
    
    // 显示模态框
    modal.style.display = 'flex';
}

// 关闭历史记录模态框
function closeHistoryFormModal() {
    const modal = document.getElementById('historyFormModal');
    modal.style.display = 'none';
}

// 保存表单
function saveFormWithName() {
    const formName = document.getElementById('formName').value.trim();
    if (!formName) {
        // 只高亮输入框，不显示红色提示字
        const input = document.getElementById('formName');
        if (input) {
            input.classList.add('error');
            const tip = document.getElementById('formName-error-tip');
            if (tip) tip.remove();
        }
        return;
    }
    
    // 获取当前表单数据
    const formData = getCurrentFormData();
    
    // 获取已保存的表单历史
    const forms = JSON.parse(localStorage.getItem('formHistory') || '[]');
    
    // 添加新表单
    forms.push({
        name: formName,
        data: formData
    });
    
    // 保存到本地存储
    localStorage.setItem('formHistory', JSON.stringify(forms));
    
    // 保存成功后移除高亮
    const input = document.getElementById('formName');
    if (input) {
        input.classList.remove('error');
        const tip = document.getElementById('formName-error-tip');
        if (tip) tip.remove();
    }
    // 关闭模态框
    closeSaveFormModal();
    // 不再弹窗，直接关闭弹窗或刷新历史列表即可
}

// 加载表单
function loadForm(index) {
    const forms = JSON.parse(localStorage.getItem('formHistory') || '[]');
    
    if (index >= 0 && index < forms.length) {
        // 使用script.js中的populateForm函数
        const formData = forms[index].data;
        document.getElementById('inputtokens').value = formData.inputTokens || '';
        document.getElementById('outputtokens').value = formData.outputTokens || '';
        
        // 清除当前所有行
        const tbody = document.querySelector('#providersTable tbody');
        tbody.innerHTML = '';
        
        // 添加服务商行
        if (formData.providers && formData.providers.length > 0) {
            formData.providers.forEach(provider => {
                const row = addProviderRow(false);
                row.querySelector('.provider-name').value = provider.providerName || '';
                row.querySelector('.recharge-amount').value = provider.recharge_amount || '';
                row.querySelector('.currency').value = provider.currency || 'USD';
                row.querySelector('.balance').value = provider.balance || '';
                row.querySelector('.input-price').value = provider.input_price || '';
                row.querySelector('.output-price').value = provider.output_price || '';
                row.querySelector('.same-price').checked = !!provider.same_price_checked;
                row.querySelector('.token-unit').value = provider.token_unit || '1000';
            });
        } else {
            // 确保至少有一行
            ensureMinimumRows();
        }
        
        // 更新导航数组
        updateNavigationArray();
        adjustFrameHeights();
        
        closeHistoryFormModal();
    }
}

// 删除表单
function deleteForm(index) {
    const forms = JSON.parse(localStorage.getItem('formHistory') || '[]');
    
    if (index >= 0 && index < forms.length) {
        const formName = forms[index].name;
        
        // 使用自定义弹窗确认删除
        showCustomConfirm(`确定要删除表单 "${formName}" 吗？`, function() {
            forms.splice(index, 1);
            localStorage.setItem('formHistory', JSON.stringify(forms));
            
            // 刷新表单列表
            openHistoryFormModal();
        });
    }
}

// 显示自定义确认弹窗
function showCustomConfirm(message, confirmCallback) {
    // 使用现有的自定义弹窗
    const modal = document.getElementById('customAlert');
    const alertMessage = document.getElementById('alertMessage');
    const confirmBtn = document.getElementById('alertConfirm');
    const cancelBtn = document.getElementById('alertCancel');
    
    // 如果取消按钮不存在，创建一个
    if (!cancelBtn) {
        const newCancelBtn = document.createElement('button');
        newCancelBtn.id = 'alertCancel';
        newCancelBtn.textContent = '取消';
        document.querySelector('.alert-buttons').appendChild(newCancelBtn);
    }
    
    // 设置消息
    alertMessage.textContent = message;
    
    // 显示弹窗
    modal.style.display = 'flex';
    
    // 确认按钮点击事件
    const handleConfirm = function() {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        document.getElementById('alertCancel').removeEventListener('click', handleCancel);
        confirmCallback();
    };
    
    // 取消按钮点击事件
    const handleCancel = function() {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', handleConfirm);
        document.getElementById('alertCancel').removeEventListener('click', handleCancel);
    };
    
    // 绑定事件
    confirmBtn.addEventListener('click', handleConfirm);
    document.getElementById('alertCancel').addEventListener('click', handleCancel);
}

// 获取当前表单数据
function getCurrentFormData() {
    // 当前使用script.js中的getFormData函数格式
    const providers = Array.from(document.querySelectorAll('#providersTable tbody tr')).map(row => {
        const nameInput = row.querySelector('.provider-name');
        if (!nameInput || !nameInput.value.trim()) return null;
        
        return {
            providerName: row.querySelector('.provider-name').value,
            recharge_amount: row.querySelector('.recharge-amount').value,
            currency: row.querySelector('.currency').value,
            balance: row.querySelector('.balance').value,
            input_price: row.querySelector('.input-price').value,
            output_price: row.querySelector('.output-price').value,
            same_price_checked: row.querySelector('.same-price').checked,
            token_unit: row.querySelector('.token-unit').value
        };
    }).filter(item => item !== null);
    
    const formData = {
        inputTokens: document.getElementById('inputtokens').value,
        outputTokens: document.getElementById('outputtokens').value,
        providers: providers
    };
    
    console.log('获取当前表单数据:', formData);
    
    return formData;
}

// 填充表单数据
function populateForm(formData) {
    // 清除当前所有行
    const tbody = document.querySelector('#providersTable tbody');
    tbody.innerHTML = '';
    
    // 填充输入和输出标记数
    if (formData.token) {
        document.getElementById('inputtokens').value = formData.token.input || '';
        document.getElementById('outputtokens').value = formData.token.output || '';
    }
    
    // 添加服务商行
    if (formData.providers && formData.providers.length > 0) {
        formData.providers.forEach(provider => {
            const row = addProviderRow(false);
            
            const nameInput = row.querySelector('.provider-name');
            const rechargeInput = row.querySelector('.recharge-amount');
            const currencySelect = row.querySelector('.currency');
            const balanceInput = row.querySelector('.balance');
            const inputPriceInput = row.querySelector('.input-price');
            const outputPriceInput = row.querySelector('.output-price');
            const singlePriceInput = row.querySelector('.single-price');
            const unitSelect = row.querySelector('.token-unit');
            
            if (nameInput) nameInput.value = provider.name || '';
            if (rechargeInput) rechargeInput.value = provider.recharge || '';
            if (currencySelect) currencySelect.value = provider.currency || 'USD';
            if (balanceInput) balanceInput.value = provider.balance || '';
            if (inputPriceInput) inputPriceInput.value = provider.inputPrice || '';
            if (outputPriceInput) outputPriceInput.value = provider.outputPrice || '';
            if (singlePriceInput) singlePriceInput.value = provider.singlePrice || '';
            if (unitSelect) unitSelect.value = provider.unit || '1';
        });
    } else {
        // 确保至少有一行
        ensureMinimumRows();
    }
    
    // 更新导航数组
    updateNavigationArray();
}

// 添加预设表单到本地存储
function addPresetFormToStorage() {
    console.log('添加预设表单到本地存储');
    const forms = JSON.parse(localStorage.getItem('formHistory') || '[]');
    
    // 检查是否已存在预设表单
    const presetExists = forms.some(form => form.name === '预设表单示例');
    console.log('预设表单是否存在:', presetExists);
    
    if (!presetExists) {
        // 转换预设数据格式以适应应用程序
        const presetData = {
            inputTokens: presetFormData.token.input.toString(),
            outputTokens: presetFormData.token.output.toString(),
            providers: presetFormData.services.map(service => ({
                providerName: service.name,
                recharge_amount: service.recharge_amount.toString(),
                currency: service.currency,
                balance: service.balance.toString(),
                input_price: service.input_price.toString(),
                output_price: service.output_price.toString(),
                same_price_checked: service.unified_io,
                token_unit: service.token_unit === 'K' ? '1000' : '1000000'
            }))
        };
        
        // 添加预设表单
        forms.push({ name: '预设表单示例', data: presetData });
        localStorage.setItem('formHistory', JSON.stringify(forms));
        console.log('预设表单已添加');
    }
}
