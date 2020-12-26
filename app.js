const Assert = require('assert-plus')
const { prop, setProp } = require('./functools')
const GetCpuUsageByProcs = require('./get_cpu_usage_by_procs')
const CalculateElectricityUsageKwBasedOnCpuUsage = require('./calculate_electricity_usage_kw_based_on_cpu_usage.js')
const CalculateCo2EmissionLbsBasedOnElectricityUsageKw = require('./calculate_co2_emission_lbs_based_on_electricity_usage_kw')

class App {
  static async invoke(_params) {
    const cpu_usage_infos = await GetCpuUsageByProcs.invoke({}) // [{ pid: 123, cpu: 0.31 }, ...]


    const el_usage_infos = await (async () => {
      const calculations = cpu_usage_infos.map(async (usage) => {
        const cpu_usage = prop(usage, 'cpu')
        const el_usage = await CalculateElectricityUsageKwBasedOnCpuUsage.invoke(cpu_usage)

        return setProp(usage, 'electricity_usage_kw', el_usage)
      })

      return Promise.all(calculations)
    })()


    const co2_em_infos = await (async () => {
      const calculations = el_usage_infos.map(async (usage) => {
        const el_usage = prop(usage, 'electricity_usage_kw')
        const co2_em = await CalculateCo2EmissionLbsBasedOnElectricityUsageKw.invoke(el_usage)

        return setProp(usage, 'co2_emission_lbs', co2_em)
      })

      return Promise.all(calculations)
    })()


    const total_co2_em = co2_em_infos
      .map(info => prop(info, 'co2_emission_lbs'))
      .reduce((x, y) => x + y, 0)

    console.log('%d lbs', total_co2_em)
  }
}

module.exports = App
