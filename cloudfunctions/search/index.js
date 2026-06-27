const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { keyword, limit = 20 } = event

  if (!keyword || keyword.length < 1) {
    return { code: 0, data: [] }
  }

  try {
    const regex = db.RegExp({ regexp: escapeRegex(keyword), options: 'i' })

    // 搜索题目
    const { data: questions } = await db.collection('questions')
      .where(_.or([
        { question: regex },
        { explanation: regex },
        { bankId: regex }
      ]))
      .limit(limit)
      .get()

    // 搜索知识点：多字段匹配
    const { data: knowledge } = await db.collection('knowledge_items')
      .where(_.or([
        { title: regex },
        { tags: regex },
        { definition: regex },
        { group: regex },
        { syntax: regex }
      ]))
      .limit(limit)
      .get()

    const results = []

    for (const q of questions) {
      results.push({
        type: 'question',
        id: q.questionId,
        title: q.question,
        preview: q.question.substring(0, 80),
        matchScore: calcScore(keyword, q.question + (q.explanation || ''))
      })
    }

    for (const k of knowledge) {
      // 合并所有可搜索文本计算分数
      const allText = [
        k.title, k.definition, k.syntax, k.group,
        ...(k.tags || []).join(' '),
        ...(k.examples || []).map(e => (e.title || '') + ' ' + (e.description || '')).join(' ')
      ].join(' ')

      results.push({
        type: 'knowledge',
        id: k.knowledgeId,
        title: k.title,
        preview: k.definition ? k.definition.substring(0, 80) : '',
        matchScore: calcScore(keyword, allText)
      })
    }

    results.sort((a, b) => b.matchScore - a.matchScore)
    return { code: 0, data: results.slice(0, limit) }
  } catch (e) {
    console.error('search error:', e)
    return { code: -1, message: e.message }
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function calcScore(keyword, text) {
  if (!text) return 0
  const lt = text.toLowerCase()
  const lk = keyword.toLowerCase()
  if (lt === lk) return 100
  if (lt.startsWith(lk)) return 80
  if (lt.includes(lk)) return 50
  return 10
}
