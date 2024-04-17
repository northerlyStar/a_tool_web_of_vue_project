<template>
  <div class="hash_page">
    <div class="flex_inline">
      <div class="upload_item">
        <div class="item_label">图像1</div>
        <img id="standard" src="" alt="" />
        <el-upload
          action="#"
          :on-preview="handlePictureCardPreview"
          :auto-upload="false"
          :on-change="changeUpload1"
        >
          <el-button size="small" type="primary">点击上传</el-button>
          <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
        </el-upload>
      </div>

      <div class="upload_item">
        <div class="item_label">图像2</div>
        <img id="student" src="" alt="" />
        <el-upload
          action="#"
          :on-preview="handlePictureCardPreview"
          :auto-upload="false"
          :on-change="changeUpload2"
        >
          <el-button size="small" type="primary">点击上传</el-button>
          <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
        </el-upload>
      </div>
    </div>

    <div class="result_group">
      <el-button type="primary" @click="compare">对比</el-button>
      <el-progress type="circle" :percentage="like" :format="formatPercentage"></el-progress>
    </div>

    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog>
  </div>
</template>

<script>
import { compressImg, createGrayscale, getHashFingerprint, hammingDistance } from "@/utils/hash.js";

export default {
  name: 'hash-page',
  data() {
    return {
      standard: null,
      standardImage: '',
      student: null,
      studentImage: '',
      dialogImageUrl: "",
      dialogVisible: false,
      like: 0,
    };
  },
  computed: {
  },
  methods: {
    // eslint-disable-next-line no-unused-vars
    async changeUpload1(file, fileList) {
      this.standard = file;
      this.showImage('standard', file).then(async base64String => {
        this.standardImage = await compressImg(base64String);
        this.standardImage = await createGrayscale(this.standardImage);
        this.standardImage = await getHashFingerprint(this.standardImage);
      }).catch(error => {
        console.error(error);
      });
    },
    // eslint-disable-next-line no-unused-vars
    async changeUpload2(file, fileList) {
      this.student = file;
      this.showImage('student', file).then(async base64String => {
        this.studentImage = await compressImg(base64String);
        this.studentImage = await createGrayscale(this.studentImage);
        this.studentImage = await getHashFingerprint(this.studentImage);
      }).catch(error => {
        console.error(error);
      });
    },
    // 回显上传图片以及返回处理后的图片
    showImage(name, file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
          // 回显图片
          const img = document.getElementById(name);
          img.src = event.target.result;
          // 返回base64图片
          resolve(event.target.result);
        };

        reader.onerror = function(error) {
          reject(error);
        };

        reader.readAsDataURL(file.raw);
      });
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    compare() {
      if (this.standardImage && this.studentImage) {
        // 图片指纹汉明距离
        const hamming = hammingDistance(this.standardImage, this.studentImage);
        // (字符串长度 - 汉明距离) / 字符串长度
        this.like = (this.standardImage.length - hamming) / this.standardImage.length * 100;
      } else {
        this.like = 0;
      }
    },
    formatPercentage(e) {
      return '相似度: ' + e + '%';
    },
  },
};
</script>
<style scoped>
.hash_page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}
.flex_inline {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px;
}
.hash_page .upload_item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.hash_page .upload_item .item_label {
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 1.1rem;
}
.hash_page .upload_item img {
  flex: 1;
  width: 100%;
  height: auto;
}
.result_group {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.result_group .el-button {
  margin-bottom: 20px;
}
</style>
