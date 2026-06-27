const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, itemId, itemType, preview, ids } = event
  const openid = cloud.getWXContext().OPENID

  if (!openid) return { code: -1, message: '用户未登录' }

  try {
    switch (action) {
      case 'add': {
        // 检查是否已收藏
        const { data: existing } = await db.collection('user_favorites')
          .where({ _openid: openid, itemId, itemType })
          .limit(1).get()

        if (existing.length === 0) {
          await db.collection('user_favorites').add({
            data: { _openid: openid, itemId, itemType, preview: preview || '', addedAt: Date.now() }
          })
        }
        return { code: 0 }
      }

      case 'remove': {
        await db.collection('user_favorites')
          .where({ _openid: openid, itemId, itemType })
          .remove()
        return { code: 0 }
      }

      case 'list': {
        const query = { _openid: openid }
        if (event.itemType && event.itemType !== 'all') {
          query.itemType = event.itemType
        }
        const { data } = await db.collection('user_favorites')
          .where(query)
          .orderBy('addedAt', 'desc')
          .get()
        return { code: 0, data }
      }

      case 'batchRemove': {
        if (ids && ids.length > 0) {
          await db.collection('user_favorites')
            .where({ _openid: openid, itemId: _.in(ids) })
            .remove()
        }
        return { code: 0 }
      }

      default:
        return { code: -1, message: `未知 action: ${action}` }
    }
  } catch (e) {
    console.error('syncFavorites error:', e)
    return { code: -1, message: e.message }
  }
}
