<template>
  <div class="ocr_page">
    <div class="flex_inline">
      <div class="upload_item">
        <div class="item_label">标准答案</div>
        <el-upload
          action="#"
          list-type="picture-card"
          :on-preview="handlePictureCardPreview"
          :auto-upload="false"
          :on-change="changeUpload1"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
        <div class="item_label">标准答案 文字版</div>
        <el-input type="textarea" v-model="textarea" placeholder="" :rows="8"></el-input>
      </div>

      <div class="upload_item">
        <div class="item_label">学生答案</div>
        <el-upload
          action="#"
          list-type="picture-card"
          :on-preview="handlePictureCardPreview"
          :auto-upload="false"
          :on-change="changeUpload2"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
      </div>
    </div>

    <div class="result_group">
      <el-button type="primary" @click="compare">对比</el-button>
      <el-progress v-show="getLike[0]" type="circle" :percentage="getLike[0]" :format="formatPercentage"></el-progress>
      <el-progress v-show="getLike[1]" type="circle" :percentage="getLike[1]" :format="formatPercentage"></el-progress>
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
      ocrResult: "",
      textarea: '',
      ocrResult2: "",
      like: [0, 0],
      dialogImageUrl: "",
      dialogVisible: false,
    };
  },
  computed: {
    getLike() {
      return this.like.map((item) => {
        return Math.round(item * 100000) / 1000;
      });
    },
  },
  methods: {
    changeUpload1(file) {
      this.performOCR(file.url);
    },
    changeUpload2(file) {
      this.performOCR2(file.url);
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },
    formatPercentage(e) {
      return '相似度: ' + e + '%';
    },

    async performOCR(image) {
      this.ocrResult = await getStr(image);
    },
    async performOCR2(image) {
      this.ocrResult2 = await getStr(image);
    },

    compare() {
      // console.log(this.ocrResult, this.ocrResult2);
      // let str1 =
      //   '[ root@node0l “| # java - version java version "1.8.0 212" Java(TM) SE Runtime Environment (build 1.8.0_212-b10) Java HotSpot(TM) 64- Bit Server VM (build 25.212-b10, mixed mode) [ rootBnodeol | # fi';
      // let str2 =
      //   '[ root@luzy “| # java - version java version "1.8.0 181" Java(TM) SE Runtime Environment (build 1.8.0_181-b10) Java HotSpot(TM) 64- Bit Server VM (build 25.212-b10, mixed mode) [ rootBnodeol | # fi';

      // this.like = levenshtein(this.ocrResult, this.ocrResult2);

      // this.contrastEveryItem(this.ocrResult, this.ocrResult2);

      // this.newContrastEveryItem(this.ocrResult, this.ocrResult2);

      // this.newNewContrastEveryItem(this.ocrResult, this.ocrResult2);

      // this.filterContrastEveryItem(this.ocrResult, this.ocrResult2);

      this.filterMaxMinContrastEveryItem(this.ocrResult, this.ocrResult2);
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
    formatArr(arr) {
      const a = arr.split('\n').filter((item) => item);
      const b = a.slice(0, a.length - 1);
      const c = b.map((item) => item.split(' ')).flat().filter((item) => !(/^\d+$/.test(item) || /(@|\^|\$|#|\.|\+|-|\*|\/|=)/.test(item)));
      return c;
    },
    // 分段取相似，过滤换行符号，过滤纯数字，过滤纯相同和纯不同，去除一个最大值和一个最小值
    filterMaxMinContrastEveryItem(text, text2) {
      // 图片比对图片
      const t = this.formatArr(text);
// jps
// NameNode
// NodeManager
// ResourceManager
// DataNode
// SecondaryNameNode
// Jps
      // 文字比对图片
      const tt = this.textarea.split('\n');
      const t2 = this.formatArr(text2);

      const likeArr = t.map((a) => {
        return Math.max(...(t2.map((b) => levenshtein(a, b))));
      }).filter((like) => like !== 0);

      const likeArr2 = tt.map((a) => {
        return Math.max(...(t2.map((b) => levenshtein(a, b))));
      }).filter((like) => like !== 0);

      console.log(likeArr, likeArr2);

      // 最大值索引
      const maxIndex = likeArr.findIndex((like) => like == Math.max(...likeArr));
      likeArr.splice(maxIndex, 1);
      // 最小值索引
      const minIndex = likeArr.findIndex((like) => like == Math.min(...likeArr));
      likeArr.splice(minIndex, 1);
      // 最大值索引
      const maxIndex2 = likeArr2.findIndex((like) => like == Math.max(...likeArr2));
      likeArr2.splice(maxIndex2, 1);
      // 最小值索引
      const minIndex2 = likeArr2.findIndex((like) => like == Math.min(...likeArr2));
      likeArr2.splice(minIndex2, 1);

      const averageLike = likeArr.length && likeArr.reduce((a, b) => a + b) / likeArr.length;
      const averageLike2 = likeArr2.length && likeArr2.reduce((a, b) => a + b) / likeArr2.length;

      this.like = [averageLike, averageLike2];
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
