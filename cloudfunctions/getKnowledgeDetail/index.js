const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { knowledgeId } = event

  if (!knowledgeId) {
    return { code: -1, message: '缺少 knowledgeId 参数' }
  }

  try {
    const { data } = await db.collection('knowledge_items')
      .where({ knowledgeId })
      .limit(1)
      .get()

    if (data.length === 0) {
      return { code: -1, message: '知识点不存在' }
    }

    return { code: 0, data: data[0] }
  } catch (e) {
    console.error('getKnowledgeDetail error:', e)
    return { code: -1, message: e.message }
  }
}
