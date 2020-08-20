/*
* @Desc 新增编辑控制器
* @Author  折威
* @Date 2020-08-14 18:46:08
*/

<template>
  <el-dialog
    append-to-body
    width="400px"
    :visible.sync="show"
    :title="dialogTitle">
    <el-form
      label-position="top"
      ref="form"
      :rules="rules"
      :model="form">
      <template v-for="(door, index) in form.deviceBindList">
        <!--  -->
        <el-form-item
          :label="$t('user_home_doorNumber', { num: index + 1})"
          :prop="`deviceBindList.${index}.deviceKey`"
          :key="index">
          <template v-if="door.deviceKey">
            <span>{{$t('user_home_conditionalStatement')}}</span>
            <el-input readonly class="door-no" v-model="door.deviceName" />
            <i class="iconfont icon-close" @click="handleDeleteDoorNo(index)" />
          </template>
          <div v-else-if="door.id">{{$t('user_home_iAmAnother')}}</div>
          <el-button v-else class="w100" @click="showBindDialog(index)">
            <i class="el-icon-plus"></i>
            <span class="f-blue text">{{$t('user_home_textScanningTest')}}</span>
          </el-button>
        </el-form-item>
      </template>
      <div class="ac">
        <el-button @click="show = false">{{$t('common_cancel')}}</el-button>
        <el-button type="primary" @click="submit">{{$t('common_add')}}</el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<script>
import i18n from '@/locales'

import I18N from 'src/utils/I18N';

import {
  name2Rule,
  numRangeValidator,
  ipRule } from '@/libs/rules'
import * as api from '@/api/device/device'
import IpInput from '@/components/ip-input'

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
    const timeValidator = (rule, value, callback) => {
      return numRangeValidator(i18n.t('user_home_pleaseEnterTheDoorExtension'), value, callback, 1, 2147483647)
    }
    return {
      show: false,
      rules: {
        name: [
          { required: true, validator: name2Rule, trigger: 'blur' }
        ],
        openDoorDelayTime: [
          {
            required: true, validator: timeValidator, trigger: 'blur'
          }
        ],
        controlStyle: [
          { required: true, message: i18n.t('user_home_pleaseSelectTheController'), trigger: 'blur' }
        ],
        ip: [
          { required: true, message: this.$t('device_addManual.message.requiredIpAddress'), trigger: 'blur' },
          { validator: ipRule, trigger: 'blur' }
        ]
      },
      form: {
        ip: '',
        name: '',
        controlStyle: 3, // 控制方式： 1：常开 2：常闭 3：在线控制 （当常闭模式时开门延时不可配置）
        openDoorDelayTime: '3' // 默认值: 3s
      },
      controllerTypeList: [
        {
          value: 3,
          label: i18n.t('user_home_onlineControl')
        },
        {
          value: 2,
          label: i18n.t('user_home_normallyClosed')
        },
        {
          value: 1,
          label: i18n.t('user_home_normallyOpen')
        }
      ],
      tableColumnList: [
        {
          prop: 'deviceGroup',
          label: this.$t('deviceList_table_th_deviceGroup')
        },
        {
          prop: 'deviceName',
          label: this.$t('deviceList_table_th_deviceName')
        },
        {
          prop: 'deviceKey',
          label: this.$t('deviceList_table_th_deviceKey'),
          minWidth: '180'
        }
      ],
      doorNoIndex: '', // 门号序列
      bindDialogVisible: false,
      dataList: [],
      requireOver: false,
      pageParams: {
        total: 0,
        pageNum: 1,
        pageSize: 10
      }
    }
  },
  computed: {
    dialogTitle () {
      return this.form.id ? this.$t('deviceList_dialog_edit_title') : this.$t('deviceList_dialog_choose_title')
    },
    showEmptyTable () {
      return this.requireOver && !this.dataList.length
    },
    bindDeviceKeys () {
      return this.form.deviceBindList && this.form.deviceBindList.map(item => item.deviceKey)
    }
  },
  mounted () {
  },
  methods: {
    handleBind (row) {
      const bindKeys = this.form.deviceBindList.map(item => item.deviceKey)
      if (bindKeys.includes(row.deviceKey)) {
        this.$message.error(i18n.t('user_home_theAccessControlDeviceHas'))
        return
      }
      const { deviceName, deviceKey } = row
      this.$set(this.form.deviceBindList[this.doorNoIndex], 'deviceName', deviceName)
      this.$set(this.form.deviceBindList[this.doorNoIndex], 'deviceKey', deviceKey)
      this.bindDialogVisible = false
    },
    handleQuery (page) {
      if (page) this.pageParams.pageNum = 1
      const params = {
        ...this.pageParams
      }
      api.deviceList(params).then(res => {
        const { list, pageNum, total } = res.data
        const dataList = list || []
        this.dataList = dataList
        this.pageParams = { ...this.pageParams, pageNum, total }
      }).catch(() => {
        this.dataList = []
      }).finally(() => {
        this.requireOver = true
      })
    },
    // 格式化初始数据
    formatFormData () {
      const { deviceBindList, availableNum } = this.data
      let list = Array.from({ length: availableNum }, (v, i) => {
        const doorNo = (deviceBindList || []).find(item => Number(item.doorNo) === i + 1)
        return doorNo || {
          deviceName: '',
          deviceKey: '',
          doorNo: i + 1 + ''
        }
      })
      return JSON.parse(JSON.stringify({
        ...this.form,
        ...this.data,
        controlStyle: this.data.controlStyle || this.form.controlStyle || 3,
        openDoorDelayTime: this.data.openDoorDelayTime || this.form.openDoorDelayTime || 3,
        deviceBindList: list
      }))
    },
    handleControlStyleChange () {
      this.form.openDoorDelayTime = 3
    },
    showBindDialog (index) {
      this.doorNoIndex = index
      this.bindDialogVisible = true
      this.handleQuery(1)
    },
    // 删除门号绑定设备
    handleDeleteDoorNo (index) {
      this.$set(this.form.deviceBindList[index], 'deviceName', '')
      this.$set(this.form.deviceBindList[index], 'deviceKey', '')
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (valid) {
          const request = this.form.id ? api.updateDoorController : api.addDoorController
          const params = {
            ...this.form,
            deviceBindList: this.form.deviceBindList.filter(item => item.deviceKey)
          }
          request(params).then(res => {
            const message = !this.form.id ? this.$t('common_delete_handle_add_success_tip') : this.$t('common_delete_handle_edit_success_tip')
            this.$message.success(message)
            this.$emit('handle-success', this.form)
          })
        }
      })
    }
  },
  watch: {
    data: {
      handler (val) {
        this.form = this.formatFormData()
        this.$nextTick(() => {
          const form = this.$refs.form
          if (form) form.clearValidate()
        })
      },
      immediate: true
    },
    visible: {
      handler (val) {
        this.show = val
      },
      immediate: true
    },
    show: {
      handler (val) {
        this.$emit('update:visible', val)
        if (!val) {
          const form = this.$refs.form
          if (form) form.resetFields()
        }
      }
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
