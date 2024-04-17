// 将图片压缩成8*8像素
export function compressImg(imgSrc, imgWidth=8) {
  return new Promise((resolve, reject) => {
    if (!imgSrc) {
      reject('imgSrc can not be empty!')
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function () {
      canvas.width = imgWidth
      canvas.height = imgWidth
      ctx?.drawImage(img, 0, 0, imgWidth, imgWidth)
      const data = ctx?.getImageData(0, 0, imgWidth, imgWidth)
      resolve(data)
    }
    img.src = imgSrc
  })
}

// 根据 RGBA 数组生成 ImageData
export function createImgData(dataDetail) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const imgWidth = Math.sqrt(dataDetail.length / 4)
  const newImageData = ctx?.createImageData(imgWidth, imgWidth)
  for (let i = 0; i < dataDetail.length; i += 4) {
    let R = dataDetail[i]
    let G = dataDetail[i + 1]
    let B = dataDetail[i + 2]
    let Alpha = dataDetail[i + 3]

    newImageData.data[i] = R
    newImageData.data[i + 1] = G
    newImageData.data[i + 2] = B
    newImageData.data[i + 3] = Alpha
  }
  return newImageData
}

// 图片灰度化
export function createGrayscale(imgData) {
  const newData = Array(imgData.data.length)
  newData.fill(0)
  imgData.data.forEach((_data, index) => {
    if ((index + 1) % 4 === 0) {
      const R = imgData.data[index - 3]
      const G = imgData.data[index - 2]
      const B = imgData.data[index - 1]

      const gray = ~~((R + G + B) / 3)
      newData[index - 3] = gray
      newData[index - 2] = gray
      newData[index - 1] = gray
      newData[index] = 255 // Alpha 值固定为255
    }
  })
  return createImgData(newData)
}

// 图片指纹
export function getHashFingerprint(imgData) {
  const grayList = imgData.data.reduce((pre, cur, index) => {
    if ((index + 1) % 4 === 0) {
      pre.push(imgData.data[index - 1])
    }
    return pre
  }, [])
  const length = grayList.length
  const grayAverage = grayList.reduce((pre, next) => (pre + next), 0) / length
  return grayList.map(gray => (gray >= grayAverage ? 1 : 0)).join('')
}

// 汉明距离
export function hammingDistance(str1, str2) {
  let distance = 0
  const str1Arr = str1.split('')
  const str2Arr = str2.split('')
  str1Arr.forEach((letter, index) => {
    if (letter !== str2Arr[index]) {
      distance++
    }
  })
  return distance
}
