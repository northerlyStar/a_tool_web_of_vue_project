<template>
  <div class="opencv_page">
      <div>
      <h1>OpenCV - 矩形提取</h1>
    </div>
    <div class="card">
      <div class="card-header">
        原图
      </div>
      <div class="card-block">
        <canvas id="canvasInput"></canvas>
      </div>
      <div class="card-footer">
        <input type="file" id="sourceInput" name="file" />
        <el-button type="primary" @click="start">开始提取</el-button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">图片预处理，高斯模糊、图片压缩</div>
      <div class="card-block"><canvas id="canvasOutput1"></canvas></div>
      <div class="card-footer">
        <el-button type="primary" disabled>下载图片</el-button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">边缘检测</div>
      <div class="card-block"><canvas id="canvasOutput2"></canvas></div>
      <div class="card-footer">
        <el-button type="primary" disabled>下载图片</el-button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">漫水填充</div>
      <div class="card-block"><canvas id="canvasOutput3"></canvas></div>
      <div class="card-footer">
        <el-button type="primary" disabled>下载图片</el-button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">直线检测</div>
      <div class="card-block"><canvas id="canvasOutput4"></canvas></div>
      <div class="card-footer">
        <el-button type="primary" disabled>下载图片</el-button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        结果
      </div>
      <div class="card-block">
        <canvas id="canvasOutput"></canvas>
      </div>
      <div class="card-footer">
        <el-button type="primary" @click="downloadImage">下载图片</el-button>
      </div>
    </div>
  </div>
</template>

<script>
const publicPath = process.env.BASE_URL
export default {
  name: 'opencv-page',
  data(){
    return {
      disabledBtn: false,
    };
  },
  mounted(){
    
    // eslint-disable-next-line no-undef
    const srcArr = Array.from(window.document.scripts).map(item => item.src);
    if (!srcArr.find((src) => src.indexOf('js/demo.js') !== -1)) {
      this.initOpencv();
    }

    this.disabled = false;

    const inputSourceElement = document.getElementById("sourceInput");
    inputSourceElement.addEventListener("change", e => {
      let files = e.target.files;
      if (files.length > 0) {
        let imgUrl = URL.createObjectURL(files[0]);
        this.loadImageToCanvas(imgUrl, 'canvasInput');
      }
    }, false);
  },
  methods: {
    initOpencv() {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.async = 'async'
      script.src = `${publicPath}js/opencv.js`
      document.body.appendChild(script)
      script.onload = () => {
        console.log('OpenCV.js is loaded.')
      }
      const script3 = document.createElement('script')
      script3.type = 'text/javascript'
      script3.async = 'async'
      script3.src = `${publicPath}js/demo.js`
      document.body.appendChild(script3)
      script3.onload = () => {
        console.log('demo.js is loaded.')
      }
      const script2 = document.createElement('script')
      script2.type = 'text/javascript'
      script2.async = 'async'
      script2.src = `${publicPath}js/new-my.js`
      document.body.appendChild(script2)
      script2.onload = () => {
        console.log('new-my.js is loaded.')
      }
    },
    loadImageToCanvas(url, cavansId) {
      let canvas = document.getElementById(cavansId);
      let ctx = canvas.getContext('2d');
      let img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
      };
      img.src = url;
    },
    // 提取矩形
    start () {
      this.disabledBtn = true;
      try {
        // eslint-disable-next-line no-undef
        let sourceMat = cv.imread("canvasInput");
        // eslint-disable-next-line no-undef
        getRect(sourceMat, "canvasOutput");
      } catch (error) {
        console.error(error)
      }
      this.disabledBtn = false;
    },
    // 下载图片
    downloadImage () {
      const link = document.createElement('a');
      link.href = document.getElementById("canvasOutput").toDataURL("image/png")
      link.download = 'result.png'; // 替换为你希望下载的图片的文件名
      link.click();
    }
  },
}
</script>

<style scoped>
.opencv_page {
  padding: 30px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 20px;
}
.opencv_page div:nth-child(1) {
  grid-column-start: 1;
  grid-column-end: 4;
  text-align: center;
}
.opencv_page .card {
  border: 1px solid #999999;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}
.opencv_page .card .card-header {
  background-color: #e7e6e6;
  border-bottom: 1px solid #999999;
  padding: 20px;
}
.opencv_page .card .card-block {
  flex: 1;
}
.opencv_page .card .card-footer {
  border-top: 1px solid #999999;
  padding: 20px;
}
.card-block > canvas {
  width: 100%;
}
input[type="button"],
input::file-selector-button,
.button {
  border: none;
  background-color: #409EFF;
  color: #ffffff;
  padding: 12px 20px;
  border-radius: 4px;
  text-decoration-line: none;
  display: inline-block;
  font-size: 14px;
}
input[type="button"]:hover,
input::file-selector-button:hover,
.button:hover {
  background-color: #66b1ff;
  cursor: pointer;
}
</style>
