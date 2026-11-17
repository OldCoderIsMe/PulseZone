# PulseZone

PulseZone 是一个面向跑步、骑行和游泳的心率训练区间计算工具。

## 功能

- 最大心率法：支持 Tanaka 与 Fox 两种年龄估算公式
- 储备心率法：基于最大心率与静息心率的 Karvonen 思路
- 乳酸阈值心率法：基于 LTHR 测试值划分训练区间
- 结果页可将三种方法并列对比，切换运动场景后对比结果保留
- 三种运动场景和移动端适配
- 不依赖后端，不保存用户输入

## 本地运行

这是一个无构建依赖的静态网页，直接用任意静态服务器即可运行：

```bash
python3 -m http.server 4173
# 打开 http://127.0.0.1:4173
```

运行测试：

```bash
npm test
```

## GitHub Actions 预览与发布

仓库包含 GitHub Actions 工作流 `.github/workflows/deploy-pages.yml`：

- 每次 Pull Request 和手动运行都会执行测试、语法检查，并上传一个可下载的预览构建产物；
- 合并到 `main` 后会自动发布到 GitHub Pages；
- 在 GitHub 的 **Actions** 页面打开对应运行记录，可在 **Artifacts** 下载预览文件；
- 首次发布前，在仓库 **Settings → Pages** 将发布来源设置为 **GitHub Actions**。

发布后，工作流运行详情页会显示 GitHub Pages 的预览地址。

## 说明

计算结果用于训练规划参考，不替代医生或专业教练建议。运动场景会影响训练感受、测量稳定性和目标设置，实际训练应结合设备、主观体感和专业建议校准。
