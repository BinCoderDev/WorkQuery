const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 聚合：按 categoryId 去重，返回分类列表
    const { data } = await db.collection('knowledge_items')
      .aggregate()
      .group({
        _id: '$categoryId',
        categoryName: db.command.aggregate.first('$categoryName'),
        categoryId: db.command.aggregate.first('$categoryId'),
        count: db.command.aggregate.sum(1)
      })
      .end()

    return { code: 0, data }
  } catch (e) {
    console.error('getKnowledgeCategories error:', e)
    return { code: -1, message: e.message }
  }
}
