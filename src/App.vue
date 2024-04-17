<template>
  <div id="app">
    <el-menu :default-active="activeIndex" mode="horizontal" @select="handleSelect">
      <el-menu-item v-for="(item, index) in menu" :key="index" :index="item.index">{{ item.label }}</el-menu-item>
    </el-menu>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      menu: [
        {
          label: '主页',
          index: '/',
        },
        {
          label: 'OCR识别',
          index: '/ocr',
        },
        {
          label: '平均哈希算法',
          index: '/hash',
        },
        {
          label: 'OpenCV矩形提取',
          index: '/opencv',
        },
      ],
    }
  },
  computed: {
    activeIndex() {
      const obj = this.menu.find((item) => item.index === this.$route.path);
      return obj?.index || '/';
    },
  },
  methods: {
    handleSelect(key) {
      if (key === this.$route.path) {
        return;
      }
      this.$router.push({
        path: key,
      });
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  text-align: center;
}
</style>
