import Tesseract from 'tesseract.js';

let text = ''
export async function getStr(img) {
  await tesseract(img)

  return text
}
/**
 * 识别文字内容，img为图片路径，可以是临时路径，也可以是网络路径
 * @param img
 */
export async function tesseract(img) {
  await Tesseract.recognize(
    img,
    'eng+chi_sim', // 使用英文引擎和中文引擎
    {
      //配置本地资源路径，语言包的实际位置是通过langPath+'/'+lang+'.traineddata.gz'得到的，所以不要改语言包文件名
      workerPath: "/tesseract/tesseract.js/dist/worker.min.js",
      corePath: "/tesseract/tesseract.js-core/tesseract-core.wasm.js",
      langPath: "/tesseract/tesseract-lang",  // TODO：prd环境下会报错
      logger: (m) => console.log(m),
    }
  ).then(
    result => {
      text = result.data.text;
    },
    error => {
      console.error(error);
    }
  );
}

/**
 * 获取两个字符串的相似度
 * @param str1
 * @param str2
 * @returns {number}
 */
export function levenshtein(str1, str2) {
  console.log('字符串1：', str1);
  console.log('字符串2：', str2);
  // 创建一个二维数组
  let matrix = [];
  // 初始化第一列和第一行
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }

  // 计算两个字符串之间的编辑距离
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // 删除
          Math.min(matrix[i][j - 1] + 1, // 插入
            matrix[i - 1][j] + 1)); // 替换
      }
    }
  }

  // 返回编辑距离
  return 1 - matrix[str1.length][str2.length] / Math.max(str1.length, str2.length);
}

