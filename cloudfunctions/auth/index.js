const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/**
 * 用户认证云函数
 *
 * action:
 *  - 'login'      静默登录：返回当前用户的 openid 和 profile（若存在）
 *  - 'syncProfile'  同步用户资料：保存/更新昵称和头像
 */
exports.main = async (event, context) => {
  const { action } = event
  const openid = cloud.getWXContext().OPENID

  if (!openid) {
    return { code: -1, message: '无法获取用户标识' }
  }

  try {
    switch (action) {

      case 'login': {
        // 查询用户是否已有 profile
        const { data } = await db.collection('users')
          .where({ _openid: openid })
          .limit(1)
          .get()

        const profile = data.length > 0
          ? { nickName: data[0].nickName, avatarUrl: data[0].avatarUrl }
          : null

        return {
          code: 0,
          data: {
            openid,
            profile
          }
        }
      }

      case 'syncProfile': {
        const { nickName, avatarUrl } = event

        // Upsert users 集合
        const { data: existing } = await db.collection('users')
          .where({ _openid: openid })
          .limit(1)
          .get()

        if (existing.length > 0) {
          await db.collection('users')
            .doc(existing[0]._id)
            .update({
              data: {
                nickName,
                avatarUrl,
                updatedAt: Date.now()
              }
            })
        } else {
          await db.collection('users').add({
            data: {
              _openid: openid,
              nickName,
              avatarUrl,
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
          })
        }

        return {
          code: 0,
          data: { nickName, avatarUrl }
        }
      }

      default:
        return { code: -1, message: `未知 action: ${action}` }
    }
  } catch (e) {
    console.error('auth error:', e)
    return { code: -1, message: e.message }
  }
}
