/**
 * 内容导入脚本
 *
 * 将 data/banks/*.json 和 data/knowledge/*.json 中的种子数据
 * 批量导入微信云数据库。
 *
 * 使用方式：
 *   1. 填充 data/ 目录下的 JSON 模板文件
 *   2. 将此脚本部署为云函数，或通过云函数调用
 *   3. 或在微信开发者工具中，打开云开发控制台手动导入 JSON
 *
 * 注意：
 *   - 每个 question 的 codeHtml 字段需预先用 highlight.js 编译
 *   - questionId / knowledgeId 必须唯一
 *   - 确保 relatedQuestionIds 中的 ID 在 questions 集合中存在
 */

const fs = require('fs')
const path = require('path')

const BANK_FILES = [
  'data/banks/excel.json',
  'data/banks/python.json'
]

const KNOWLEDGE_FILES = [
  'data/knowledge/excel.json',
  'data/knowledge/python.json'
]

// 此函数需在云函数环境中调用
async function importToCloud(db) {
  console.log('=== 开始导入题库 ===')
  for (const file of BANK_FILES) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf-8'))
    const { bankId, bankName, bankIcon, bankDescription, totalQuestions, order, isActive, questions } = raw

    // 1. 导入 banks 集合
    const { data: existingBanks } = await db.collection('banks').where({ bankId }).limit(1).get()
    if (existingBanks.length > 0) {
      await db.collection('banks').doc(existingBanks[0]._id).update({
        data: { bankName, bankIcon, bankDescription, totalQuestions: questions.length, order, isActive }
      })
      console.log(`  🔄 更新题库: ${bankName}`)
    } else {
      await db.collection('banks').add({
        data: { bankId, bankName, bankIcon, bankDescription, totalQuestions: questions.length, order, isActive }
      })
      console.log(`  ✅ 新增题库: ${bankName}`)
    }

    // 2. 导入 questions（逐条写入，批量可优化为 Promise.all）
    let qCount = 0
    for (const q of questions) {
      const { data: existingQ } = await db.collection('questions').where({ questionId: q.questionId }).limit(1).get()
      if (existingQ.length > 0) {
        await db.collection('questions').doc(existingQ[0]._id).update({ data: { ...q, bankId, updatedAt: Date.now() } })
      } else {
        await db.collection('questions').add({ data: { ...q, bankId } })
      }
      qCount++
    }
    console.log(`  📝 导入题目: ${qCount} 道`)
  }

  console.log('\n=== 开始导入知识点 ===')
  for (const file of KNOWLEDGE_FILES) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf-8'))
    const { categoryId, categoryName, knowledgeItems } = raw

    let kCount = 0
    for (const k of knowledgeItems) {
      const { data: existingK } = await db.collection('knowledge_items').where({ knowledgeId: k.knowledgeId }).limit(1).get()
      if (existingK.length > 0) {
        await db.collection('knowledge_items').doc(existingK[0]._id).update({ data: { ...k, categoryId, categoryName, updatedAt: Date.now() } })
      } else {
        await db.collection('knowledge_items').add({ data: { ...k, categoryId, categoryName } })
      }
      kCount++
    }
    console.log(`  📝 导入知识点: ${kCount} 条 (${categoryName})`)
  }

  console.log('\n🎉 导入完成！')
}

// 如果直接作为云函数运行
if (require.main === module) {
  const cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  const db = cloud.database()
  importToCloud(db).catch(e => console.error('导入失败:', e))
}

module.exports = { importToCloud }
