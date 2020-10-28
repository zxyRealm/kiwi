<template>
  <div>
    <template slot-scope="{ title }">
      {{`${$t('user_home_father')} ${title}`}}
      <template slot-scope="{ subTitle }">
        {{`${$t('user_home_subset')}${subTitle}`}}
      </template>
      <div class="text">{{$t('user_home_thisIsNormalText')}}</div>
      <div :title="$t('user_home_attributeText')"></div>
    </template>
  </div>
</template>

<script>
import i18n from '@/locales'

export default {
  name: 'controller-dialog',
  components: {
    IpInput
  },
  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      show: false,
      isDispaly: false
    }
  }
}
</script>

<style scoped lang="scss">
.time-input {
  width: 120px;
}
.door-no {
  width: calc(100% - 40px);
  margin-right: 10px;
}

.seperate-line {
  height: 1px;
  margin-bottom: 20px;
  background: $M7;
}
/deep/.el-table {
  &__body {
    &-wrapper {
      height: calc(100% - 50px);
    }
  }
}

</style>
