const start = Date.now()
require('child_process').exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`执行出错: ${error}`)
    return
  }
  const end = Date.now()
  console.log(`打包总耗时: ${(end - start) / 1000}s`)
})
