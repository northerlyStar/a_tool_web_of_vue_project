/* eslint-disable */
function getRect(src, name) {
  // 计算图片调整比例
  let scale = getScale(Math.max(src.rows, src.cols));
  // 图像预处理，高斯模糊、滤波
  let preMat = preProcess(src, scale);
  cv.imshow("canvasOutput1", preMat);
  // 强边缘阈值
  const highThresh = 200;
  // 弱边缘阈值
  const lowThresh = 190;
  let canny = new cv.Mat();
  // 边缘检测
  cv.Canny(preMat, canny, lowThresh, highThresh, 3);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(canny, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  let floodFillMat = null;
  if (contours.size() === 1) {
    let dst = cv.Mat.zeros(preMat.rows, preMat.cols, cv.CV_8UC3);
    cv.drawContours(dst, contours, 0, new cv.Scalar(255, 255, 255), 1, 8, hierarchy, 0);
    // 漫水填充
    floodFillMat = getSegmentImage(dst);
    cv.imshow("canvasOutput2", dst);
    dst.delete();
  } else {
    let canny = new cv.Mat();
    // 边缘检测
    cv.Canny(preMat, canny, lowThresh, highThresh, 3);
    floodFillMat = getSegmentImage(canny);
    cv.imshow("canvasOutput2", canny);
    canny.delete();
  }
  cv.imshow("canvasOutput3", floodFillMat);
  // 检测直线
  let lines = getLinesWithDetect(floodFillMat);
  // 获取四个顶点
  let points = getFourVertex(lines, scale, { height: src.rows, width: src.cols });
  // 坐标映射
  let result = getResultWithMap(src, points);
  // 克隆result
  const src1 = result.clone();
  const src2 = result.clone();
  // 增加result的对比度、亮度
  const addWeightedMat = new cv.Mat(result.rows, result.cols, result.type());
  // src1的透明度
  const alpha = 1;
  // src2的透明度，这个数值越接近1画面越亮
  const betta = 0.4;
  const gamma = 0;
  cv.addWeighted(src1, alpha, src2, betta, gamma, addWeightedMat);

  cv.imshow(name, addWeightedMat);

  src.delete();
  preMat.delete();
  canny.delete();
  floodFillMat.delete();
  result.delete();

  contours.delete();
  hierarchy.delete();
}