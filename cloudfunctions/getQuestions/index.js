const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { bankId, pageIndex = 0, pageSize = 20 } = event

  if (!bankId) {
    return { code: -1, message: '缺少 bankId 参数' }
  }

  try {
    // 获取总数
    const { total } = await db.collection('questions')
      .where({ bankId })
      .count()

    // 分页查询
    const { data } = await db.collection('questions')
      .where({ bankId })
      .orderBy('orderIndex', 'asc')
      .skip(pageIndex * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        questions: data,
        total,
        hasMore: (pageIndex + 1) * pageSize < total
      }
    }
  } catch (e) {
    console.error('getQuestions error:', e)
    return { code: -1, message: e.message }
  }
}
