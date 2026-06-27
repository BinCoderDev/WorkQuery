const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { categoryId, sortBy = 'usageFrequency' } = event

  if (!categoryId) {
    return { code: -1, message: '缺少 categoryId 参数' }
  }

  try {
    // 排序字段映射
    const orderField = sortBy === 'title' ? 'title' : 'usageFrequency'
    const orderDir = sortBy === 'title' ? 'asc' : 'desc'

    const { data } = await db.collection('knowledge_items')
      .where({ categoryId })
      .orderBy(orderField, orderDir)
      .get()

    // 按 group 字段分组
    const groups = {}
    for (const item of data) {
      const g = item.group || '其他'
      if (!groups[g]) groups[g] = []
      groups[g].push(item)
    }

    // 转换为数组格式
    const groupedData = Object.entries(groups).map(([group, items]) => ({
      group,
      items
    }))

    return { code: 0, data: groupedData }
  } catch (e) {
    console.error('getKnowledgeItems error:', e)
    return { code: -1, message: e.message }
  }
}
