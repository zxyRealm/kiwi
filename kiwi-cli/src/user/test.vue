/*
* @Desc 不同文件重复 key 值测试
* @Author  折威
* @Date 2020-08-28 14:19:44
*/

<template>
  <div>
    <span>{{$t('user_home_textScanningTest')}}</span>
    <div v-if="show">{{$t('user_home_iAmAnother')}}</div>
  </div>
</template>

<script>
import i18n from '@/locales'

export default {
  name: 'test',
  data () {
    return {
      show: false
    }
  },
  mounted () {},
  methods: {
  }
}
</script>

<style scoped lang="scss">

</style>
