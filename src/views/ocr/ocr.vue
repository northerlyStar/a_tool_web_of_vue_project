<template>
  <div class="ocr_page">
    <div class="flex_inline">
      <div class="upload_item">
        <div class="item_label">标准答案</div>
        <el-upload
          action="https://jsonplaceholder.typicode.com/posts/"
          list-type="picture-card"
          :on-preview="handlePictureCardPreview"
          :auto-upload="true"
          :on-change="changeUpload1"
          :http-request="handleHttpRequest"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
      </div>

      <div class="upload_item">
        <div class="item_label">学生答案</div>
        <el-upload
          action="https://jsonplaceholder.typicode.com/posts/"
          list-type="picture-card"
          :on-preview="handlePictureCardPreview"
          :auto-upload="true"
          :on-change="changeUpload2"
          :http-request="handleHttpRequest2"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
      </div>
    </div>

    <div class="result_group">
      <el-button type="primary" @click="compare">对比</el-button>
      <!-- <input type="file" @change="readFile" /> -->
      <!-- <input type="file" @change="readFile2" /> -->
      <!-- <button @click="compare">对比</button> -->
      <!-- <div v-if="ocrResult">
        OCR Result: {{ ocrResult }}
      </div>
      <div v-if="ocrResult2">
        OCR Result: {{ ocrResult2 }}
      </div> -->
      <!-- <div>相似度：{{ like }}</div> -->
      <el-progress v-show="getLike" type="circle" :percentage="getLike" :format="formatPercentage"></el-progress>
    </div>

    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog>
  </div>
</template>

<script>
import { getStr, levenshtein } from "@/utils/ocr.js";

export default {
  name: 'ocr-page',
  data() {
    return {
      fileList1: [],
      fileList2: [],
      ocrResult: "",
      ocrResult2: "",
      like: 0,
      dialogImageUrl: "",
      dialogVisible: false,
    };
  },
  computed: {
    getLike() {
      return Math.round(this.like * 100000) / 1000;
    },
  },
  methods: {
    changeUpload1(file, fileList) {
      this.fileList1 = fileList;
      this.performOCR(file.url);
    },
    changeUpload2(file, fileList) {
      this.fileList2 = fileList;
      this.performOCR2(file.url);
    },
    handleHttpRequest() {
      console.log('readfile: ', this.fileList1);
    },
    handleHttpRequest2() {
      console.log('readfile: ', this.fileList2);
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    formatPercentage(e) {
      return '相似度: ' + e + '%';
    },

    // readFile(event) {
    //   const file = event.target.files[0];
    //   if (!file) {
    //     return;
    //   }
    //   const reader = new FileReader();
    //   reader.onload = (e) => {
    //     this.performOCR(e.target.result);
    //   };
    //   reader.readAsDataURL(file);
    // },
    // readFile2(event) {
    //   const file = event.target.files[0];
    //   if (!file) {
    //     return;
    //   }
    //   const reader = new FileReader();
    //   reader.onload = (e) => {
    //     this.performOCR2(e.target.result);
    //   };
    //   reader.readAsDataURL(file);
    // },

    async performOCR(image) {
      this.ocrResult = await getStr(image);
    },
    async performOCR2(image) {
      this.ocrResult2 = await getStr(image);
    },

    compare() {
      console.log(this.ocrResult, this.ocrResult2);
      // let str1 =
      //   '[ root@node0l “| # java - version java version "1.8.0 212" Java(TM) SE Runtime Environment (build 1.8.0_212-b10) Java HotSpot(TM) 64- Bit Server VM (build 25.212-b10, mixed mode) [ rootBnodeol | # fi';
      // let str2 =
      //   '[ root@luzy “| # java - version java version "1.8.0 181" Java(TM) SE Runtime Environment (build 1.8.0_181-b10) Java HotSpot(TM) 64- Bit Server VM (build 25.212-b10, mixed mode) [ rootBnodeol | # fi';

      // this.like = levenshtein(this.ocrResult, this.ocrResult2);

      // this.list = this.contrastEveryItem(this.ocrResult, this.ocrResult2);

      // this.list = this.newContrastEveryItem(this.ocrResult, this.ocrResult2);

      // this.list = this.newNewContrastEveryItem(this.ocrResult, this.ocrResult2);

      // this.list = this.filterContrastEveryItem(this.ocrResult, this.ocrResult2);

      this.list = this.filterMaxMinContrastEveryItem(this.ocrResult, this.ocrResult2);
    },
    // 分段取相似
    contrastEveryItem(text, text2) {
      const t = text.split(' ');
      const t2 = text2.split(' ');
      const likeArr = t.map((a) => {
        return Math.max(...(t2.map((b) => levenshtein(a, b))));
      });
      const averageLike = likeArr.reduce((a, b) => a + b) / likeArr.length;

      console.log('likeArr: ', likeArr);

      this.like = averageLike;
    },
    // 极端值处理
    newContrastEveryItem(text, text2) {
      const t = text.split(' ');
      const t2 = text2.split(' ');
      const likeArr = t.map((a) => {
        return Math.max(...(t2.map((b) => levenshtein(a, b))));
      });
      const averageLike = likeArr.reduce((a, b) => a + b) / likeArr.length;

      const varianceArr = likeArr.map((like) => {
        return Math.pow(like - averageLike, 2);
      });

      console.log('varianceArr: ', varianceArr);

      this.like = varianceArr.reduce((a, b) => a + b) / varianceArr.length;
    },
    // 去除一个最大值和一个最小值
    newNewContrastEveryItem(text, text2) {
      const t = text.split(' ');
      const t2 = text2.split(' ');
      const likeArr = t.map((a) => {
        return Math.max(...(t2.map((b) => levenshtein(a, b))));
      });

      // 最大值索引
      const maxIndex = likeArr.findIndex((like) => like == Math.max(...likeArr));
      likeArr.splice(maxIndex, 1);
      // 最小值索引
      const minIndex = likeArr.findIndex((like) => like == Math.min(...likeArr));
      likeArr.splice(minIndex, 1);

      // 求平均值
      const averageLike = likeArr.reduce((a, b) => a + b) / likeArr.length;

      console.log('likeArr: ', likeArr);

      this.like = averageLike;
    },
    // 分段取相似，过滤换行符号，过滤纯数字
    filterContrastEveryItem(text, text2) {
      const t = text.split(' ').map((item) => item.split('\n')).flat().filter((ite) => ite && !(/^(B|b|BL|\d)\d+$/.test(ite)));
      const t2 = text2.split(' ').map((item) => item.split('\n')).flat().filter((ite) => ite && !(/^(B|b|BL|\d)\d+$/.test(ite)));
      const likeArr = t.map((a) => {
        return Math.max(...(t2.map((b) => levenshtein(a, b))));
      });
      const averageLike = likeArr.reduce((a, b) => a + b) / likeArr.length;

      console.log('likeArr: ', likeArr);

      this.like = averageLike;
    },
    // 分段取相似，过滤换行符号，过滤纯数字，过滤纯相同和纯不同，去除一个最大值和一个最小值
    filterMaxMinContrastEveryItem(text, text2) {
      console.log(text.split(' '), text2.split(' '));
      const t = text.split(' ').map((item) => item.split('\n'));
      const t2 = text2.split(' ').map((item) => item.split('\n'));
      const t3 = t.flat().filter((ite) => ite && !(/^(B|b|BL|\d)\d+$/.test(ite)));
      const t4 = t2.flat().filter((ite) => ite && !(/^(B|b|BL|\d)\d+$/.test(ite)));
      console.log(t3, t4);
      const likeArr = t.map((a) => {
        return Math.max(...(t2.map((b) => levenshtein(a, b))));
      }).filter((like) => like !== 0);
      // 最大值索引
      const maxIndex = likeArr.findIndex((like) => like == Math.max(...likeArr));
      likeArr.splice(maxIndex, 1);
      // 最小值索引
      const minIndex = likeArr.findIndex((like) => like == Math.min(...likeArr));
      likeArr.splice(minIndex, 1);

      const averageLike = likeArr.reduce((a, b) => a + b) / likeArr.length;

      // console.log('newLikeArr: ', likeArr);

      this.like = averageLike;
    },
  },
};
</script>
<style scoped>
.ocr_page {
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
.ocr_page .upload_item {}
.ocr_page .upload_item .item_label {
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 1.1rem;
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
