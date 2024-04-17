/* eslint-disable */
const g_nLowDifference = 35
const g_nUpDifference = 35; //负差最大值、正差最大值 
const UNCAL_THETA = 0.5;
class Line {
  constructor(rho, theta) {
    this.rho = rho
    this.theta = theta
    let a = Math.cos(theta);
    let b = Math.sin(theta);
    let x0 = a * rho;
    let y0 = b * rho;
    this.startPoint = { x: x0 - 400 * b, y: y0 + 400 * a };
    this.endPoint = { x: x0 + 400 * b, y: y0 - 400 * a };
  }
}

let src = null;

/**
 * @param {Object} srcMat
 */
function itemExtract(srcMat, name) {
  src = srcMat;
  let scale = getScale(Math.max(srcMat.rows, srcMat.cols))
  let preMat = preProcess(srcMat, scale)
  cv.imshow("canvasOutput1", preMat);
  let grayMat = getSegmentImage(preMat)
  cv.imshow("canvasOutput2", grayMat);
  let lines = getLinesWithDetect(grayMat)
  let points = getFourVertex(lines, scale, { height: srcMat.rows, width: srcMat.cols })
  let result = getResultWithMap(srcMat, points)
  cv.imshow(name, result);
  preMat.delete()
  grayMat.delete()
  srcMat.delete()
  result.delete()
}
/**
 * 获取缩放比例
 * @param {*} len 
 */
function getScale(len) {
  let scale = 1
  while (len > 200) {
    scale /= 2
    len >>= 1
  }
  return scale
}
/**
 * 预处理
 * @param {*} src 
 */
function preProcess(src, scale) {
  let smallMat = resize(src, scale)
  let result = filter(smallMat)
  smallMat.delete()
  return result
}
/**
 * 调整至指定宽高
 * @param {*} src 
 * @param {*} scale 缩放比例 
 */
function resize(src, scale = 1) {
  let smallMat = new cv.Mat();
  let dsize = new cv.Size(0, 0);
  cv.resize(src, smallMat, dsize, scale, scale, cv.INTER_AREA)
  return smallMat
}
/**
 * 滤波：保边去噪
 * @param {*} mat 
 */
function filter(src) {
  let dst = new cv.Mat();
  cv.cvtColor(src, src, cv.COLOR_RGBA2RGB, 0);
  // 双边滤波
  cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);
  return dst
}
/**
 * 通过分割图像获取前景灰度图
 * @param {*} src 
 */
function getSegmentImage(src) {
  const srcCopy = new cv.Mat(src.rows, src.cols, src.type(), new cv.Scalar(0, 0, 0));
  // 使用 `copyTo()` 函数复制 `src` 到 `srcCopy`
  src.copyTo(srcCopy);
  const mask = new cv.Mat(srcCopy.rows + 2, srcCopy.cols + 2, cv.CV_8U, [0, 0, 0, 0])
  const seed = new cv.Point(srcCopy.cols >> 1, srcCopy.rows >> 1)
  let flags = 4 + (255 << 8) + cv.FLOODFILL_FIXED_RANGE
  let ccomp = new cv.Rect()
  let newVal = new cv.Scalar(255, 255, 255)
  // 选取中点，采用floodFill漫水填充
  cv.threshold(mask, mask, 1, 128, cv.THRESH_BINARY);
  cv.floodFill(srcCopy, mask, seed, newVal, ccomp, new cv.Scalar(g_nLowDifference, g_nLowDifference, g_nLowDifference), new cv.Scalar(g_nUpDifference, g_nUpDifference, g_nUpDifference), flags);
  // 再次执行一次滤波去除噪点
  cv.medianBlur(mask, mask, 9);
  return mask
}


function getLinesFromData32F(data32F) {
  let lines = []
  let len = data32F.length / 2
  for (let i = 0; i < len; ++i) {
    let rho = data32F[i * 2];
    let theta = data32F[i * 2 + 1];
    lines.push(new Line(rho, theta))
  }
  return lines
}
/**
 * 直线检测
 * @param {*} mat 
 */
function getLinesWithDetect(src) {
  let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  let lines = new cv.Mat();
  // Canny 算子进行边缘检测
  cv.Canny(src, src, 50, 200, 3);
  cv.HoughLines(src, lines, 1, Math.PI / 180,
    30, 0, 0, 0, Math.PI);
  // draw lines
  for (let i = 0; i < lines.rows; ++i) {
    let rho = lines.data32F[i * 2];
    let theta = lines.data32F[i * 2 + 1];
    let a = Math.cos(theta);
    let b = Math.sin(theta);
    let x0 = a * rho;
    let y0 = b * rho;
    let startPoint = { x: x0 - 400 * b, y: y0 + 400 * a };
    let endPoint = { x: x0 + 400 * b, y: y0 - 400 * a };
    cv.line(dst, startPoint, endPoint, [255, 0, 0, 255]);
  }
  let lineArray = getLinesFromData32F(lines.data32F)
  drawLineMat(src.rows, src.cols, lineArray)
  return lineArray
}
/**
 * 计算两直线间的交点
 * @param {*} l1 
 * @param {*} l2 
 */
function getIntersection(l1, l2) {
  //角度差太小 不算，
  let minTheta = Math.min(l1.theta, l2.theta)
  let maxTheta = Math.max(l1.theta, l2.theta)
  if (Math.abs(l1.theta - l2.theta) < UNCAL_THETA || Math.abs(minTheta + Math.PI - maxTheta) < UNCAL_THETA) {
    return;
  }
  //计算两条直线的交点
  let intersection;
  //y = a * x + b;
  let a1 = Math.abs(l1.startPoint.x - l1.endPoint.x) < Number.EPSILON ? 0 : (l1.startPoint.y - l1.endPoint.y) / (l1.startPoint.x - l1.endPoint.x);
  let b1 = l1.startPoint.y - a1 * (l1.startPoint.x);
  let a2 = Math.abs((l2.startPoint.x - l2.endPoint.x)) < Number.EPSILON ? 0 : (l2.startPoint.y - l2.endPoint.y) / (l2.startPoint.x - l2.endPoint.x);
  let b2 = l2.startPoint.y - a2 * (l2.startPoint.x);
  if (Math.abs(a2 - a1) > Number.EPSILON) {
    let x = (b1 - b2) / (a2 - a1)
    let y = a1 * x + b1
    intersection = { x, y }
  }
  return intersection
}
/**
 * 计算所有交点
 * @param {*} lines 
 */
function getAllIntersections(lines) {
  let points = []
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      let point = getIntersection(lines[i], lines[j])
      if (point) {
        points.push(point)
      }
    }
  }
  return points
}
/**
 * 聚类取均值
 * @param {*} points 
 * @param {*} param1 
 */
function getClusterPoints(points, { width, height }) {
  const DISTANCE = Math.max(40, (width + height) / 20)
  const isNear = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)) < DISTANCE
  // 多边形中心点坐标
  const center = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  }
  // points.sort((p1, p2) => {
  //   // y=kx theta = atan(k)
  //   // TODO cache calc
  //   const theta1 = Math.atan((p1.y - center.y) / ((p1.x - center.x) || 0.01))
  //   const theta2 = Math.atan((p2.y - center.y) / ((p2.x - center.x) || 0.01))
  //   return theta1 - theta2
  // })

  points.sort((a, b) => {
    if (a.x !== b.x) {
      return a.x - b.x; // 先按照 x 属性升序排列
    } else {
      return a.y - b.y; // 如果 x 属性相同，则按照 y 属性升序排列
    }
  });


  let clusters = [[points[0]]]
  for (let i = 1; i < points.length; i++) {
    if (isNear(points[i], points[i - 1])) {
      clusters[clusters.length - 1].push(points[i])
    } else {
      clusters.push([points[i]])
    }
  }

  // 除去量最少的，仅保留四个聚类
  // clusters = clusters.sort((c1, c2) => c2.length - c1.length).slice(0, 4)
  let result = clusters.map(cluster => {
    const x = ~~(cluster.reduce((sum, cur) => sum + cur.x, 0) / cluster.length)
    const y = ~~(cluster.reduce((sum, cur) => sum + cur.y, 0) / cluster.length)
    return { x, y }
  })

  let sortedPoints = []
  sortedPoints[0] = result.filter(p => p.x < center.x && p.y < center.y);
  sortedPoints[1] = result.filter(p => p.x > center.x && p.y < center.y);
  sortedPoints[2] = result.filter(p => p.x > center.x && p.y > center.y);
  sortedPoints[3] = result.filter(p => p.x < center.x && p.y > center.y);

  result = sortedPoints.map(cluster => {
    const x = ~~(cluster.reduce((sum, cur) => sum + cur.x, 0) / cluster.length)
    const y = ~~(cluster.reduce((sum, cur) => sum + cur.y, 0) / cluster.length)
    return { x, y }
  })

  return result

  // 欧几里得距离
  // let coordinate = findMaxDistance(result);
  let coordinate = findLargestInscribedRectangle(result);
  return coordinate;
}
function findMaxDistance(points) {
  let allDistance = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      allDistance.push({point1: points[i], point2: points[j], distance});
    }
  }
  allDistance.sort((a, b) => b.distance - a.distance);
  const result = allDistance.slice(0, 2);

  return result.map((res) => [res.point1, res.point2]).flat();
}
/**
 * 顺时针排序，以中心点左上角为第一个点
 * @param {*} points 
 */
function getSortedVertex(points) {
  let center = {
    x: points.reduce((sum, p) => sum + p.x, 0) / 4,
    y: points.reduce((sum, p) => sum + p.y, 0) / 4
  }
  let sortedPoints = []
  sortedPoints.push(points.find(p => p.x < center.x && p.y < center.y))
  sortedPoints.push(points.find(p => p.x > center.x && p.y < center.y))
  sortedPoints.push(points.find(p => p.x > center.x && p.y > center.y))
  sortedPoints.push(points.find(p => p.x < center.x && p.y > center.y))
  return sortedPoints
}

/**
 * 根据聚类获得四个顶点的坐标
 */
function getFourVertex(lines, scale, { width, height }) {
  // 缩放 + 过滤
  let allPoints = getAllIntersections(lines).map(point => ({
    x: ~~(point.x / scale), y: ~~(point.y / scale)
  })).filter(({ x, y }) => !(x < 0 || x > width || y < 0 || y > height))
  const points = getClusterPoints(allPoints, { width, height })
  const sortedPoints = getSortedVertex(points)
  return sortedPoints
}
/**
 * 抠图，映射
 * @param {*} src 
 * @param {*} points 
 */
function getResultWithMap(src, points) {
  let array = []
  points.forEach(point => {
    array.push(point.x)
    array.push(point.y)
  })
  let dst = new cv.Mat();
  let dsize = new cv.Size(0, 0);
  let dstWidth = src.cols
  let dstHeight = src.rows
  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, array);
  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, dstWidth, 0, dstWidth, dstHeight, 0, dstHeight]);
  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(src, dst, M, dsize);
  let resizeDst = resize(dst, 0.5)
  M.delete(); srcTri.delete(); dstTri.delete(); dst.delete()
  return resizeDst
}
function drawLineMat(rows, cols, lines) {
  let dst = cv.Mat.zeros(rows, cols, cv.CV_8UC3);
  let color = new cv.Scalar(255, 0, 0);
  for (let line of lines) {
    cv.line(dst, line.startPoint, line.endPoint, color);
  }
  cv.imshow("canvasOutput4", dst);
}

function findLargestInscribedRectangle(vertices) {
  
  vertices.forEach((a) => {
    // 在图像上画点
    const point = new cv.Point(a.x, a.y); // 画点的坐标
    const radius = 100; // 点的半径
    const color = new cv.Scalar(0, 0, 255); // 点的颜色，这里使用蓝色
    cv.circle(src, point, radius, color, cv.FILLED);
  });
  cv.imshow('canvasOutput3', src);

  // 计算多边形的中心点
  const center = calculateCenter(vertices);

  let minAngle = Infinity;
  let maxAngle = -Infinity;
  let minIndex = 0;
  let maxIndex = 0;

  // 遍历多边形的顶点，找到夹角最小和最大的顶点
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    const p3 = vertices[(i + 2) % vertices.length];

    const angle = calculateAngle(p1, p2, p3);

    if (angle < minAngle) {
      minAngle = angle;
      minIndex = (i + 1) % vertices.length;
    }

    if (angle > maxAngle) {
      maxAngle = angle;
      maxIndex = (i + 1) % vertices.length;
    }
  }

  // 计算内接矩形的边向量
  const edgeVector = {
    x: Math.abs(vertices[maxIndex].x - vertices[minIndex].x),
    y: Math.abs(vertices[maxIndex].y - vertices[minIndex].y),
  };

  // 构造内接矩形的四个顶点
  const rectangle = [
    {
      x: center.x - edgeVector.x / 2,
      y: center.y - edgeVector.y / 2,
    },
    {
      x: center.x + edgeVector.x / 2,
      y: center.y + edgeVector.y / 2,
    },
    {
      x: Math.abs(center.x + edgeVector.x / 2 - edgeVector.y),
      y: center.y + edgeVector.y / 2 + edgeVector.x,
    },
    {
      x: Math.abs(center.x - edgeVector.x / 2 - edgeVector.y),
      y: Math.abs(center.y - edgeVector.y / 2 + edgeVector.x),
    },
  ];

  return rectangle;
}

// 计算多边形的中心点
function calculateCenter(vertices) {
  let centerX = 0;
  let centerY = 0;

  for (const vertex of vertices) {
    centerX += vertex.x;
    centerY += vertex.y;
  }

  centerX /= vertices.length;
  centerY /= vertices.length;

  return { x: centerX, y: centerY };
}

// 计算三个点之间的夹角
function calculateAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dotProduct = v1.x * v2.x + v1.y * v2.y;
  const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  const cosTheta = dotProduct / (magnitude1 * magnitude2);
  const angle = Math.acos(cosTheta);

  return angle;
}
