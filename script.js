class BackgroundRemover {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.tolerance = 10;
        this.originalImageData = null;
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.processingSection = document.getElementById('processingSection');
        this.resultSection = document.getElementById('resultSection');
        this.originalImage = document.getElementById('originalImage');
        this.resultCanvas = document.getElementById('resultCanvas');
        this.toleranceSlider = document.getElementById('tolerance');
        this.toleranceValue = document.getElementById('toleranceValue');
        this.reprocessBtn = document.getElementById('reprocessBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }

    bindEvents() {
        // 文件上传事件
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 拖拽上传事件
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // 控制按钮事件
        this.toleranceSlider.addEventListener('input', (e) => this.updateTolerance(e));
        this.reprocessBtn.addEventListener('click', () => this.reprocessImage());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.resetBtn.addEventListener('click', () => this.resetApp());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择有效的图片文件！');
            return;
        }

        this.showProcessing();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.originalImage.src = e.target.result;
            this.originalImage.onload = () => {
                this.removeBackground();
            };
        };
        reader.readAsDataURL(file);
    }

    showProcessing() {
        this.uploadArea.style.display = 'none';
        this.processingSection.style.display = 'block';
        this.resultSection.style.display = 'none';
    }

    showResult() {
        this.processingSection.style.display = 'none';
        this.resultSection.style.display = 'block';
    }

    removeBackground() {
        const canvas = this.resultCanvas;
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸
        canvas.width = this.originalImage.naturalWidth;
        canvas.height = this.originalImage.naturalHeight;
        
        // 绘制原图到画布
        ctx.drawImage(this.originalImage, 0, 0);
        
        // 获取图像数据
        this.originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 处理图像
        this.processImageData();
        
        this.showResult();
    }

    processImageData() {
        const canvas = this.resultCanvas;
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height
        );
        
        const data = imageData.data;
        const tolerance = this.tolerance;
        
        // 遍历每个像素
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 检查是否为白色或接近白色
            if (this.isWhiteish(r, g, b, tolerance)) {
                data[i + 3] = 0; // 设置透明度为0
            }
        }
        
        // 将处理后的数据绘制到画布
        ctx.putImageData(imageData, 0, 0);
    }

    isWhiteish(r, g, b, tolerance) {
        const threshold = 255 - tolerance;
        return r >= threshold && g >= threshold && b >= threshold;
    }

    updateTolerance(e) {
        this.tolerance = parseInt(e.target.value);
        this.toleranceValue.textContent = this.tolerance;
    }

    reprocessImage() {
        if (this.originalImageData) {
            this.processImageData();
        }
    }

    downloadImage() {
        const canvas = this.resultCanvas;
        
        // 创建下载链接
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'removed-background.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }

    resetApp() {
        this.uploadArea.style.display = 'block';
        this.processingSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.fileInput.value = '';
        this.originalImageData = null;
        this.tolerance = 10;
        this.toleranceSlider.value = 10;
        this.toleranceValue.textContent = '10';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new BackgroundRemover();
});

// 添加一些实用的辅助功能
window.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
                const backgroundRemover = new BackgroundRemover();
                backgroundRemover.processFile(file);
            }
            break;
        }
    }
});

// 防止页面意外刷新时丢失工作
window.addEventListener('beforeunload', (e) => {
    const resultSection = document.getElementById('resultSection');
    if (resultSection && resultSection.style.display !== 'none') {
        e.preventDefault();
        e.returnValue = '您有未保存的处理结果，确定要离开吗？';
    }
});