import HelloWorld from '@/components/HelloWorld.vue';
import Ocr from '@/views/ocr/ocr.vue';
import Hash from '@/views/hash/hash.vue';
import OpenCV from '@/views/opencv/opencv.vue';

export default [
  { path: '/', component: HelloWorld },
  { path: '/ocr', component: Ocr },
  { path: '/hash', component: Hash },
  { path: '/opencv', component: OpenCV },
];