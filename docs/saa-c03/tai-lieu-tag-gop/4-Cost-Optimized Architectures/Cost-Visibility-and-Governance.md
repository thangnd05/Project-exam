# Theo dõi và quản trị chi phí: Cost Explorer, Budgets, Cost Allocation Tags và FinOps

> **Domain:** Cost-Optimized Architectures (exam Domain 4). Tag: Cost-Visibility-and-Governance (Cost Explorer / Budgets / Allocation Tags / FinOps). Nhìn thấy tiền đi đâu, ai tiêu, đặt hạn mức cảnh báo, tự động chặn khi vượt ngân sách, và duy trì tối ưu chi phí như một quy trình liên tục.
> **Mức độ ra đề:** Cao. Câu hỏi thường đặt Cost Explorer, Budgets, Cost and Usage Report, Cost Anomaly Detection, Trusted Advisor và Compute Optimizer làm đáp án nhiễu của nhau. Bẫy kinh điển là chọn Cost Explorer để gửi cảnh báo, và quên kích hoạt Cost Allocation Tags.
> **Cross-reference:** EC2-Purchasing-Options, S3-Storage-Classes-and-Lifecycle, Network-Costs, AWS-Compute-Optimizer, AWS-CloudWatch, Amazon-SNS, AWS-Glue-Amazon-Athena.

## 1. Tổng quan: công cụ theo dõi và quản trị chi phí giải quyết vấn đề gì

Hóa đơn AWS cuối tháng chỉ cho biết EC2 hết $5,000 và S3 hết $2,000, mà không trả lời được team Marketing tiêu bao nhiêu, dự án Phoenix tốn bao nhiêu, vì sao tháng này tăng vọt, hay đến cuối tháng sẽ vượt ngân sách bao xa. Doanh nghiệp cần bốn năng lực: **gắn nhãn** chi phí theo đơn vị kinh doanh, **nhìn và phân tích** xu hướng, **cảnh báo và chặn** trước khi bị sốc hóa đơn, và một **quy trình FinOps** để tối ưu không phải việc làm một lần.

Sáu khối kiến thức chính:

| Khối | Là gì | Vai trò |
|------|-------|---------|
| **Cost Allocation Tags** | Tag key-value trên tài nguyên, đã **Activate** trong Billing Console | Phân bổ chi phí theo phòng ban, dự án, môi trường (chargeback, showback) |
| **AWS Cost Explorer** | Giao diện biểu đồ phân tích, lọc, nhóm chi phí và dự báo | Trả lời "tiền đã đi đâu, xu hướng thế nào", gợi ý mua RI và Savings Plans |
| **Cost and Usage Report (CUR)** | Dữ liệu billing thô chi tiết nhất, xuất CSV hoặc Parquet vào S3 | Phân tích sâu bằng Athena, Redshift, QuickSight |
| **AWS Budgets** | Ngân sách tùy chỉnh với cảnh báo theo chi phí thực tế hoặc dự báo | Trả lời "tôi có đang tiêu quá hạn mức không" |
| **Budgets Actions** | Hành động tự động khi chạm ngưỡng: gắn IAM policy, SCP, dừng EC2 hoặc RDS | Biến cảnh báo thành kiểm soát cứng |
| **Cost Anomaly Detection** | Máy học tự học hành vi chi tiêu để phát hiện đột biến | Bắt chi phí bất thường mà không cần đặt ngưỡng |

> **Một câu định vị:** vẽ biểu đồ, tìm xu hướng, dự báo => **Cost Explorer**. Cảnh báo khi vượt $X (thực tế hoặc dự báo) => **AWS Budgets**. Vượt ngân sách thì tự khóa quyền hoặc tắt máy => **Budgets Actions**. Chi phí tăng bất thường mà chưa chạm ngưỡng nào => **Cost Anomaly Detection**. Dữ liệu thô cho Athena => **CUR**. Chia tiền theo team => **Cost Allocation Tags đã Activate**. Ước tính trước khi xây hệ thống => **AWS Pricing Calculator**. Cảnh báo khi vượt $0 của Free Tier => **CloudWatch Billing Alarm**. Right-size EC2 => **Compute Optimizer**. Chấm điểm năm trụ cột kèm giới hạn dịch vụ => **Trusted Advisor**.

## 2. Cost Allocation Tags

Cost Allocation Tags là tập con của tag tài nguyên được đưa vào hệ thống billing. **User-defined tags** do bạn tạo, ví dụ `CostCenter`, `Owner`, `Environment`, và **phải Activate** trong **Billing Console => Cost Allocation Tags** thì mới xuất hiện trong Cost Explorer, Budgets và CUR. **AWS-generated tags** như `aws:createdBy` hay `aws:cloudformation:stack-name` do AWS tự gắn, và cũng phải kích hoạt trước khi dùng. Sau khi Activate, dữ liệu theo tag thường mất khoảng **24 giờ** mới hiện. Tài nguyên không có tag hoặc tag chưa kích hoạt rơi vào nhóm "No tag key", làm báo cáo chargeback bị thiếu.

Quy trình chuẩn có bốn bước. Bước một là thiết kế chiến lược tag và dùng **Tag Policies** của AWS Organizations để ép các account thành viên theo cùng quy ước đặt tên. Bước hai là gắn tag bằng IaC như CloudFormation hoặc Terraform, gắn hàng loạt cho tài nguyên có sẵn bằng **Tag Editor** trong Resource Groups, và dùng IAM policy bắt buộc gắn tag khi tạo tài nguyên. Bước ba là **Activate** tag trong Billing Console. Bước bốn là phân tích bằng Cost Explorer (group by tag), đặt Budgets lọc theo tag, và tạo monitor Anomaly Detection theo tag. Khi cần gom nhiều tag, account hoặc dịch vụ vào một nhóm tùy chỉnh (ví dụ nhóm R&D gồm `Dept=Engineering` và `Dept=DataScience`) thì dùng **AWS Cost Categories**.

> **Pattern đề thi:** *Đã gắn tag Project=Alpha lên EC2 nhưng Cost Explorer không hiển thị chi phí theo tag này* => **Activate tag trong Billing Console, mục Cost Allocation Tags**.

## 3. Cost Explorer và Cost and Usage Report

Cost Explorer là công cụ giao diện đồ họa để xem chi phí và mức sử dụng dưới dạng biểu đồ, không cần viết code. Bạn nhóm và lọc theo linked account, dịch vụ, Region, instance type hoặc Cost Allocation Tag, xem theo tháng hoặc ngày, và bật thêm độ phân giải **theo giờ** (có phí) cho các chiến dịch ngắn hạn. Nó có các báo cáo dựng sẵn như chi phí theo dịch vụ, theo linked account, hiệu quả RI và Savings Plans, xem được dữ liệu lịch sử nhiều tháng và đưa ra **Forecast** chi phí các tháng tới để lập kế hoạch ngân sách.

Hai tính năng hay ra đề là khuyến nghị và báo cáo cam kết. Cost Explorer phân tích 7, 30 hoặc 60 ngày gần nhất rồi gợi ý nên mua Savings Plans bao nhiêu tiền mỗi giờ hoặc bao nhiêu RI. Báo cáo **Utilization** và **Coverage** cho biết RI và Savings Plans đã mua có được dùng hết không và có phủ đủ tài nguyên đang chạy không. Mục right-sizing của Cost Explorer thực chất lấy dữ liệu từ Compute Optimizer.

**Cost and Usage Report** là nguồn dữ liệu billing thô chi tiết nhất, tới từng tài nguyên và từng giờ, có cột tag sau khi Activate, tự động ghi thành file CSV hoặc Parquet vào S3 để Athena, Redshift hoặc QuickSight phân tích. Cost Explorer là dữ liệu đã tổng hợp cho con người nhìn nhanh, còn CUR là dữ liệu thô cho đội dữ liệu tự truy vấn.

> **Pattern đề thi:** *Hóa đơn tháng này tăng $5,000, cần tìm dịch vụ nào tăng vào ngày nào bằng biểu đồ* => **Cost Explorer, group by Service, độ phân giải Daily**.

## 4. AWS Budgets và Budgets Actions

AWS Budgets có các loại **Cost Budget** (theo tiền), **Usage Budget** (theo mức dùng như giờ chạy máy hay dung lượng S3), và **RI hoặc Savings Plans Budget** theo **Utilization** (cảnh báo khi gói đã mua bị dùng dưới mức, ví dụ dưới 85%) hoặc **Coverage** (cảnh báo khi tài nguyên mới phải chạy giá On-Demand vì chưa được gói cam kết phủ). Chu kỳ ngân sách có thể là ngày, tháng, quý hoặc năm, và lọc được theo account, dịch vụ hoặc tag. Cảnh báo dựa trên **Actual** (đã tiêu thực tế) hoặc **Forecasted** (dự báo cuối kỳ), nên đầu tháng dev lỡ bật cụm máy lớn khiến dự báo vượt 200% là Budgets báo ngay chứ không đợi cuối tháng.

Cảnh báo gửi tới tối đa 10 địa chỉ email hoặc tới **Amazon SNS**, từ đó đẩy vào Slack, Microsoft Teams hay Chime qua **AWS Chatbot** (nay là Amazon Q Developer in chat applications) hoặc gọi Lambda. **Budgets Actions** đi xa hơn cảnh báo: với một IAM role được cấp quyền, nó tự gắn **IAM policy Deny** vào user, group hoặc role, tự áp **SCP** lên account thành viên trong Organizations, hoặc tự **dừng EC2 và RDS** theo tag đã chỉ định. Đặt Budgets ở management account để giám sát chi tiêu của cả tổ chức.

> **Pattern đề thi:** *Khi account dev tiêu vượt ngân sách thì phải tự động chặn tạo thêm tài nguyên mà không cần người can thiệp* => **Budgets Actions áp IAM policy hoặc SCP**.

## 5. Cost Anomaly Detection và các công cụ lân cận

**Cost Anomaly Detection** dùng máy học tự học lịch sử chi tiêu và phát hiện đột biến bất thường, kể cả khi chi phí chưa chạm ngưỡng Budget nào, và tạo monitor được theo dịch vụ, account hoặc Cost Allocation Tag. **AWS Pricing Calculator** ước tính chi phí **trước khi** xây hệ thống, không đọc chi phí đang chạy. **CloudWatch Billing Alarm** là công cụ sơ khai dựa trên metric tổng hóa đơn, thường dùng để báo khi vượt $0 của Free Tier, không có dự báo, không chia theo tag và không có hành động tự động. **Trusted Advisor** chấm năm trụ cột (chi phí, bảo mật, chịu lỗi, hiệu năng, giới hạn dịch vụ) và chỉ báo tài nguyên nhàn rỗi, không đặt được ngân sách. **Compute Optimizer** đi sâu vào right-size EC2, EBS, Lambda, xem tag AWS-Compute-Optimizer.

> **Pattern đề thi:** *Muốn được báo khi chi phí tăng đột biến bất thường mà không phải tự đặt ngưỡng cho từng dịch vụ* => **AWS Cost Anomaly Detection**.

## 6. FinOps: tối ưu chi phí là quy trình liên tục

FinOps đưa trách nhiệm chi phí về tay đội kỹ thuật, cân bằng giữa chi phí, tốc độ đổi mới và chất lượng dịch vụ. Nó không phải một dịch vụ AWS mà là khung tư duy gồm ba giai đoạn lặp lại: **Inform** (biết tiền đi đâu, ai tiêu, bằng Cost Explorer, CUR, Cost Allocation Tags), **Optimize** (giảm lãng phí bằng Compute Optimizer, Spot, RI hoặc Savings Plans, Lifecycle, Intelligent-Tiering, VPC Endpoint), và **Operate** (giữ kỷ luật bằng Budgets, Anomaly Detection, Tag Policies, SCP). Nhịp review gợi ý là hàng tuần xem Budget alert và anomaly, hàng tháng xem Cost Explorer theo tag và khuyến nghị right-size, hàng quý xem Utilization và Coverage của RI hoặc Savings Plans cùng tài nguyên thừa, hàng năm gia hạn cam kết và rà lại chiến lược tag.

| Keyword trong đề | Đáp án ưu tiên | Loại trừ |
|------------------|----------------|----------|
| most cost-effective + truy cập S3 không đoán trước | S3 Intelligent-Tiering | Lifecycle |
| most cost-effective + 90 ngày không đọc, pattern rõ | S3 Lifecycle sang Glacier | Intelligent-Tiering |
| most cost-effective + tải chịu lỗi | Spot Instances | On-Demand |
| most cost-effective + ổn định 24/7 | RI hoặc Savings Plans | On-Demand |
| most cost-effective + private subnet gọi S3 | Gateway Endpoint (miễn phí) | NAT Gateway |
| most cost-effective + phân phối nội dung toàn cầu | CloudFront | S3 Transfer Acceleration |
| reduce operational overhead + cảnh báo billing | AWS Budgets kèm SNS | Cost Explorer |
| right-size EC2 thừa tài nguyên | Compute Optimizer (cài CloudWatch Agent để có RAM) | Resize thủ công |
| chargeback theo team | Cost Allocation Tags đã Activate | Tài nguyên không tag |

> **Pattern đề thi:** *Công ty có Budgets gửi email nhưng dev vẫn tiếp tục tạo tài nguyên đắt tiền ở account thử nghiệm* => **Cảnh báo không phải kiểm soát: dùng Budgets Actions hoặc SCP để chặn cứng**.

## 7. So sánh và chọn trong nhóm

| Công cụ | Câu hỏi nó trả lời | Tự hành động được không |
|---------|-------------------|-------------------------|
| Cost Allocation Tags | Chi phí này thuộc team hay dự án nào | Không, chỉ là nhãn |
| Cost Explorer | Đã tiêu vào đâu, xu hướng và dự báo ra sao, nên mua cam kết bao nhiêu | Không, chỉ phân tích |
| CUR | Dữ liệu thô từng dòng billing là gì | Không, chỉ xuất dữ liệu |
| AWS Budgets | Có đang hoặc sắp vượt hạn mức không | Có, qua Budgets Actions |
| Cost Anomaly Detection | Có gì bất thường so với thói quen không | Chỉ cảnh báo |

> **Pattern đề thi:** *Phòng tài chính cần gửi hóa đơn chi tiết cho từng phòng ban và đặt ngân sách riêng cho team Marketing* => **Cost Allocation Tags đã Activate, Cost Explorer theo tag, và Budgets lọc theo tag**.

## 8. Kịch bản thi

1. Cần biểu đồ trực quan và xu hướng chi tiêu. => Cost Explorer.
2. Cần biết nên mua Savings Plans bao nhiêu tiền mỗi giờ. => Khuyến nghị Savings Plans trong Cost Explorer.
3. Cảnh báo qua email khi chi phí thực tế hoặc dự báo vượt $5,000. => AWS Budgets.
4. Cảnh báo chi phí đẩy vào Slack của công ty. => Budgets kèm SNS và AWS Chatbot.
5. RI mua trước đang bị bỏ phí, tỷ lệ dùng sụt giảm. => Budgets loại RI Utilization.
6. Nạp dữ liệu billing chi tiết nhất vào Athena để tự phân tích. => Cost and Usage Report.
7. Ép 50 account trong tổ chức dùng cùng quy ước tag. => Tag Policies trong Organizations.
8. Muốn xem chi phí từng giờ của một chiến dịch marketing ngắn. => Bật độ phân giải Hourly trong Cost Explorer.

## 9. Tổng hợp các bẫy hay gặp trong đề

| Tình huống trong đề | Đáp án | Bẫy hay bị chọn nhầm |
|---------------------|--------|----------------------|
| Gửi cảnh báo khi chi phí vượt ngưỡng | AWS Budgets | Cost Explorer (không gửi cảnh báo) |
| Đã tag nhưng báo cáo không hiện | Activate trong Billing Console, chờ khoảng 24 giờ | Gắn lại tag |
| Tự động tắt máy khi phòng ban vượt ngân sách | Budgets Actions lọc theo tag | Chỉ gắn Cost Allocation Tags |
| Phát hiện chi phí tăng đột biến không rõ nguyên do | Cost Anomaly Detection | AWS Budgets (cần ngưỡng cố định) |
| Dữ liệu thô chi tiết nhất cho Big Data | CUR | Cost Explorer |
| Tìm EC2 thừa tài nguyên để giảm size | Compute Optimizer | AWS Budgets |
| Chấm điểm năm trụ cột và giới hạn dịch vụ | Trusted Advisor | Compute Optimizer hoặc Budgets |
| Báo khi vượt $0 của Free Tier | CloudWatch Billing Alarm | Cost Explorer |
| Ước tính chi phí trước khi triển khai | AWS Pricing Calculator | Cost Explorer |
| Gắn tag hàng loạt cho tài nguyên có sẵn | Tag Editor trong Resource Groups | Sửa từng tài nguyên |

## 10. Phân biệt với các dịch vụ hoặc khái niệm dễ nhầm

- **Cost Explorer vs AWS Budgets:** Cost Explorer nhìn lại và phân tích xem tiền đã đi đâu. Budgets giám sát theo hạn mức do bạn đặt, gửi cảnh báo và có thể tự hành động.
- **Cost Explorer vs CUR:** Cost Explorer là giao diện với dữ liệu đã tổng hợp để xem nhanh. CUR là dữ liệu thô chi tiết nhất đẩy vào S3 cho Athena, Redshift hoặc QuickSight.
- **AWS Budgets vs Cost Anomaly Detection:** Budgets dựa trên con số tĩnh bạn đặt. Anomaly Detection dùng máy học tự phát hiện hành vi bất thường, không cần ngưỡng.
- **AWS Budgets vs CloudWatch Billing Alarm:** Billing Alarm chỉ dựa trên metric tổng hóa đơn. Budgets chia được theo tag, dịch vụ, account, có dự báo và có Budgets Actions.
- **Cost Allocation Tags vs Resource Tags:** Mọi tag đều là resource tag dùng được cho tự động hóa hay IAM Condition, nhưng chỉ tag đã Activate trong Billing mới trở thành Cost Allocation Tag trong báo cáo chi phí.
- **Cost Allocation Tags vs Cost Categories:** Tags phân loại theo metadata trên tài nguyên. Cost Categories là quy tắc gom linh hoạt nhiều tag, account hoặc dịch vụ vào một nhóm.

## 11. Câu nhớ nhanh trước khi thi

> **Tags để phân loại, Cost Explorer để xem, Budgets để cảnh báo và chặn, CUR để xuất dữ liệu thô, Anomaly Detection để bắt đột biến.**
>
> **Gắn tag xong mà Cost Explorer không thấy => chưa Activate trong Billing Console, và phải chờ khoảng 24 giờ.**
>
> **Cảnh báo theo Actual hoặc Forecasted => AWS Budgets. Tự khóa quyền hoặc tắt máy khi vượt ngân sách => Budgets Actions.**
>
> **RI hoặc Savings Plans bị bỏ phí => Budgets Utilization. Tài nguyên mới chưa được cam kết phủ => Budgets Coverage.**
>
> **Ép quy ước tag toàn tổ chức => Tag Policies. Gắn tag hàng loạt => Tag Editor.**
>
> **FinOps là Inform, Optimize, Operate lặp lại liên tục. Cảnh báo không phải kiểm soát, cần Budgets Actions hoặc SCP.**
