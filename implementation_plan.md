# Thêm mục Khám phá và role Nhà tuyển dụng

Mục tiêu là bổ sung một khu vực cộng đồng trong NextSteps để:

- **Nhà tuyển dụng** có thể đăng bài tuyển dụng/cơ hội nghề nghiệp ở mục **Khám phá**.
- **User** có thể đăng CV/hồ sơ của mình lên **Khám phá** để được tìm thấy hoặc nhận góp ý.
- User có thể bấm từ **bài đăng tuyển dụng** để đưa JD đó vào phần **Phân tích CV**.
- Mọi người có thể **bình luận** dưới bài đăng/CV.
- Hệ thống có thêm role mới: **Nhà tuyển dụng**.
- **User thường** có thể gửi yêu cầu trở thành Nhà tuyển dụng.
- **Admin** duyệt yêu cầu và đổi role thủ công.
- Bài tuyển dụng do Nhà tuyển dụng đăng phải được **Admin duyệt** trước khi public.
- Admin có thêm khu vực **Quản lý nhà tuyển dụng** và **Quản lý bài viết**.

## User Review Required

> [!IMPORTANT]
> Role kỹ thuật đề xuất lưu trong database là `recruiter`, còn UI hiển thị là **Nhà tuyển dụng**.

> [!IMPORTANT]
> Luồng duyệt đề xuất:
>
> 1. User gửi yêu cầu trở thành Nhà tuyển dụng.
> 2. Admin xem trong **Quản lý nhà tuyển dụng**.
> 3. Admin duyệt thì đổi role user thành `recruiter`.
> 4. Nhà tuyển dụng đăng bài tuyển dụng.
> 5. Bài tuyển dụng ở trạng thái `pending`.
> 6. Admin duyệt bài thì bài mới hiện ở **Khám phá**.

> [!WARNING]
> Thêm role `recruiter` vào PostgreSQL enum `users_role` cần migration cẩn thận. Nếu enum đã tồn tại, migration nên dùng `ALTER TYPE users_role ADD VALUE IF NOT EXISTS 'recruiter'` hoặc kiểm tra tương thích với version PostgreSQL hiện tại.

## Open Questions

> [!IMPORTANT]
> Khi user bấm “Phân tích CV với bài này”, bạn muốn:
>
> 1. Chuyển sang `/app` và tự điền JD vào form phân tích CV.
> 2. Tạo luôn một `job_info` draft rồi chuyển user vào màn hình upload CV.
>
> Mình đề xuất chọn **(1)** để nhanh, ít rủi ro và dễ chỉnh UI.

---

## Proposed Changes

### 1. Database & Roles

#### [MODIFY] [user.ts](file:///d:/PRJ/NextSteps/src/drizzle/schema/user.ts)

- Thêm role `recruiter` vào `userRoles`:
  - `user`
  - `pro`
  - `recruiter`
  - `admin`
- Cập nhật relations:
  - User có nhiều bài explore.
  - User có nhiều comment.
  - User có nhiều yêu cầu trở thành nhà tuyển dụng.

#### [NEW] `src/drizzle/schema/explore.ts`

Tạo schema cho Khám phá.

##### `explore_posts`

Dùng chung cho bài tuyển dụng và bài CV ứng viên.

- `id`
- `authorId`
- `type`: `job_post` hoặc `cv_showcase`
- `status`: `pending`, `published`, `rejected`, `hidden`, `deleted`
- `title`
- `content`
- `companyName` nullable
- `positionTitle` nullable
- `location` nullable
- `salaryRange` nullable
- `skills` nullable
- `cvUrl` nullable
- `cvFileName` nullable
- `rejectionReason` nullable
- `reviewedById` nullable
- `reviewedAt` nullable
- `createdAt`, `updatedAt`

Quy tắc status:

- Bài tuyển dụng từ recruiter: tạo với `pending`.
- Admin duyệt: chuyển sang `published`.
- Admin từ chối: chuyển sang `rejected`, lưu `rejectionReason`.
- User thường đăng CV: đề xuất tạo thẳng `published`.
- Admin hoặc chủ bài có thể `hidden/deleted` tùy quyền.

##### `explore_comments`

- `id`
- `postId`
- `authorId`
- `content`
- `status`: `published`, `hidden`, `deleted`
- `createdAt`, `updatedAt`

##### `recruiter_requests`

Bảng lưu yêu cầu trở thành nhà tuyển dụng.

- `id`
- `userId`
- `companyName`
- `companyWebsite` nullable
- `businessEmail` nullable
- `position`
- `reason`
- `status`: `pending`, `approved`, `rejected`, `cancelled`
- `adminNote` nullable
- `reviewedById` nullable
- `reviewedAt` nullable
- `createdAt`, `updatedAt`

Khi admin approve:

- Update `users.role = 'recruiter'`.
- Update request status `approved`.
- Lưu `reviewedById`, `reviewedAt`.

#### [MODIFY] [schema.ts](file:///d:/PRJ/NextSteps/src/drizzle/schema.ts)

- Export schema mới:

```ts
export * from "./schema/explore"
```

#### [NEW] Drizzle migrations

- Thêm enum value `recruiter` vào `users_role`.
- Tạo enum/table:
  - `explore_post_type`
  - `explore_post_status`
  - `explore_comment_status`
  - `recruiter_request_status`
  - `explore_posts`
  - `explore_comments`
  - `recruiter_requests`

---

### 2. Server Logic / Feature Module

#### [NEW] `src/features/explore/schemas.ts`

Zod validation cho:

- Tạo bài tuyển dụng.
- Tạo bài CV ứng viên.
- Tạo comment.
- Duyệt/từ chối bài viết.
- Gửi yêu cầu trở thành nhà tuyển dụng.
- Duyệt/từ chối yêu cầu nhà tuyển dụng.

#### [NEW] `src/features/explore/db.ts`

Query helpers:

- `getPublishedExplorePosts()`
- `getExplorePostById()`
- `getExplorePostComments()`
- `getMyExplorePosts()`
- `getPendingExplorePostsForAdmin()`
- `getRecruiterRequestsForAdmin()`
- `getMyRecruiterRequest()`

#### [NEW] `src/features/explore/actions.ts`

Server actions cho user/recruiter:

##### User actions

- `createCvShowcasePostAction(data)`
  - Cho phép user/pro/recruiter/admin.
  - Tạo bài `cv_showcase`.
  - Status đề xuất: `published`.

- `createExploreCommentAction(postId, content)`
  - Yêu cầu đăng nhập.
  - Chỉ comment vào bài `published`.

- `submitRecruiterRequestAction(data)`
  - User gửi yêu cầu trở thành nhà tuyển dụng.
  - Nếu đang có request `pending`, không cho gửi trùng.
  - Nếu đã là `recruiter/admin`, không cần gửi.

- `cancelRecruiterRequestAction(requestId)`
  - User hủy request của chính mình nếu còn `pending`.

##### Recruiter actions

- `createRecruiterPostAction(data)`
  - Chỉ cho phép `recruiter` hoặc `admin`.
  - Nếu `recruiter`: status mặc định `pending`.
  - Nếu `admin`: có thể cho `published` ngay.

- `updateOwnPendingRecruiterPostAction(postId, data)`
  - Recruiter chỉ sửa bài của mình khi còn `pending` hoặc `rejected`.

##### Shared owner actions

- `hideOwnExplorePostAction(postId)`
  - Chủ bài có thể ẩn bài của mình.

- `deleteOwnCommentAction(commentId)`
  - Chủ comment có thể xóa comment của mình.

#### [NEW] `src/features/admin/explore.ts`

Admin actions:

- `approveRecruiterRequestAction(requestId)`
  - Chuyển request sang `approved`.
  - Đổi role user sang `recruiter`.

- `rejectRecruiterRequestAction(requestId, adminNote)`
  - Chuyển request sang `rejected`.

- `approveExplorePostAction(postId)`
  - Chuyển bài tuyển dụng `pending` sang `published`.

- `rejectExplorePostAction(postId, reason)`
  - Chuyển bài sang `rejected`.

- `hideExplorePostAsAdminAction(postId)`
  - Ẩn bài đã public nếu vi phạm.

- `deleteExploreCommentAsAdminAction(commentId)`
  - Xóa/ẩn comment vi phạm.

---

### 3. Luồng “Đưa bài tuyển dụng vào Phân tích CV”

User có thể từ bài tuyển dụng trong Khám phá đưa JD sang phần phân tích CV.

#### [MODIFY] [CVJDAnalysis.tsx](file:///d:/PRJ/NextSteps/src/app/app/_CVJDAnalysis.tsx)

- Cho form đọc query params hoặc draft data:
  - `jobTitle`
  - `companyName`
  - `jobDescription`
  - `experienceLevel` nếu có
  - `explorePostId` nếu cần tracking
- Khi URL có dữ liệu từ bài tuyển dụng, tự prefill form.
- Hiển thị banner nhỏ:
  - “Bạn đang phân tích CV với bài tuyển dụng từ Khám phá.”
  - Link quay lại bài viết.

#### [NEW/OPTION A] Link query params từ card bài tuyển dụng

Ở card bài tuyển dụng:

```txt
/app?source=explore&postId={id}
```

Trang `/app` sẽ fetch post theo `postId` rồi prefill JD.

Ưu điểm:

- URL gọn.
- Không nhét JD dài vào query string.
- Dữ liệu luôn lấy từ DB.

Cần thêm function:

- `getExploreJobPostForAnalysis(postId)`
  - Chỉ trả bài `job_post` và `published`.

#### [MODIFY] `src/features/jobInfos/actions.ts`

- Khi user submit phân tích CV từ Explore, có thể lưu thêm metadata nếu muốn:
  - `source = 'explore'`
  - `sourceExplorePostId`

> [!NOTE]
> Nếu muốn tracking chuẩn, cần thêm cột vào `job_info`. Nếu chưa cần analytics, phase đầu chỉ prefill form là đủ.

---

### 4. Upload CV cho Khám phá

#### [NEW] `src/app/api/uploads/cv/route.ts`

- API upload CV riêng cho Khám phá.
- Dùng `uploadBufferToGoogleCloudStorage` hiện có.
- Yêu cầu đăng nhập.
- File hợp lệ:
  - PDF
  - DOC/DOCX nếu app hiện hỗ trợ
  - TXT nếu cần
- Giới hạn size đề xuất: 10MB.
- Destination:

```txt
uploads/explore-cvs/{userId}/{year}/{filename}
```

#### UI cảnh báo privacy

Trước khi user đăng CV:

- Hiển thị cảnh báo: “CV của bạn sẽ xuất hiện trong mục Khám phá cho người dùng đã đăng nhập xem.”
- User phải tick xác nhận trước khi submit.

---

### 5. App UI / Routing

#### [MODIFY] [Sidebar.tsx](file:///d:/PRJ/NextSteps/src/app/app/_Sidebar.tsx)

Thêm menu:

- Label: **Khám phá**
- Icon: `Compass` hoặc `Sparkles`
- Href: `/app/explore`

#### [NEW] `src/app/app/explore/page.tsx`

- Server page lấy current user.
- Load feed bài `published`.
- Load request recruiter hiện tại của user nếu có.

#### [NEW] `src/app/app/explore/_ExplorePage.tsx`

Giao diện chính:

- Hero section: “Khám phá cơ hội & hồ sơ ứng viên”.
- Filter tabs:
  - Tất cả
  - Tuyển dụng
  - CV ứng viên
- CTA theo role:
  - User thường: “Đăng CV” + “Yêu cầu trở thành nhà tuyển dụng”.
  - Recruiter: “Đăng tin tuyển dụng” + trạng thái bài chờ duyệt.
  - Admin: có link nhanh sang quản lý bài viết.
- Feed:
  - Card tuyển dụng.
  - Card CV ứng viên.
  - Comment section.

#### [NEW] `src/app/app/explore/[postId]/page.tsx`

Trang chi tiết bài viết:

- Hiển thị đầy đủ nội dung.
- Hiển thị comments.
- Nếu là bài tuyển dụng `published`, có CTA:
  - **Phân tích CV với bài này** → `/app?source=explore&postId={postId}`

#### [NEW] Components trong `src/features/explore/components`

- `ExploreHero.tsx`
- `ExploreTabs.tsx`
- `ExploreFeed.tsx`
- `ExplorePostCard.tsx`
- `RecruiterPostForm.tsx`
- `CvShowcaseForm.tsx`
- `RecruiterRequestForm.tsx`
- `ExploreComments.tsx`
- `CommentForm.tsx`
- `PostStatusBadge.tsx`

---

### 6. Admin UI

Admin cần thêm 2 khu vực mới.

#### [MODIFY] Admin sidebar/navigation

Thêm menu admin:

- **Quản lý nhà tuyển dụng**
- **Quản lý bài viết**

Cần kiểm tra file navigation admin hiện tại trước khi sửa.

#### [NEW] `src/app/admin/recruiter-management/page.tsx`

Trang quản lý nhà tuyển dụng:

- Danh sách request trở thành nhà tuyển dụng.
- Filter:
  - Pending
  - Approved
  - Rejected
- Hiển thị:
  - Tên user
  - Email
  - Công ty
  - Website/email công ty
  - Lý do
  - Ngày gửi
  - Trạng thái
- Actions:
  - Duyệt → đổi role user thành `recruiter`.
  - Từ chối → nhập lý do.
  - Xem user profile.

#### [NEW] `src/app/admin/post-management/page.tsx`

Trang quản lý bài viết Khám phá:

- Danh sách bài tuyển dụng/CV.
- Filter:
  - Pending
  - Published
  - Rejected
  - Hidden
  - Type: Tuyển dụng/CV
- Actions:
  - Duyệt bài tuyển dụng.
  - Từ chối bài tuyển dụng kèm lý do.
  - Ẩn bài đã public.
  - Xem chi tiết bài.
  - Quản lý/xóa comment vi phạm.

#### [MODIFY] `src/features/admin/users.ts`

- Admin vẫn có thể đổi role thủ công thành `recruiter` trong quản lý user.
- Cập nhật label role:
  - `user` → User
  - `pro` → Pro
  - `recruiter` → Nhà tuyển dụng
  - `admin` → Admin

---

### 7. Authorization Rules

| Hành động | user | pro | recruiter | admin |
|---|---:|---:|---:|---:|
| Xem Khám phá | ✅ | ✅ | ✅ | ✅ |
| Đăng CV | ✅ | ✅ | ✅ | ✅ |
| Gửi yêu cầu làm recruiter | ✅ | ✅ | ❌ | ❌ |
| Đăng bài tuyển dụng | ❌ | ❌ | ✅ | ✅ |
| Bài tuyển dụng public ngay | ❌ | ❌ | ❌ | ✅ |
| Bài tuyển dụng cần duyệt | ❌ | ❌ | ✅ | ❌ |
| Comment | ✅ | ✅ | ✅ | ✅ |
| Dùng bài tuyển dụng để phân tích CV | ✅ | ✅ | ✅ | ✅ |
| Duyệt recruiter request | ❌ | ❌ | ❌ | ✅ |
| Duyệt/từ chối bài viết | ❌ | ❌ | ❌ | ✅ |
| Đổi role thủ công | ❌ | ❌ | ❌ | ✅ |

---

### 8. Suggested Implementation Phases

#### Phase 1: Database + role + actions nền tảng

- Thêm role `recruiter`.
- Thêm schema Explore.
- Thêm schema Recruiter Request.
- Viết server actions + validation.

#### Phase 2: UI Khám phá cho user/recruiter

- Sidebar thêm Khám phá.
- Feed bài viết.
- Đăng CV.
- Gửi yêu cầu làm recruiter.
- Recruiter đăng bài chờ duyệt.
- Comment.

#### Phase 3: Admin management

- Quản lý nhà tuyển dụng.
- Quản lý bài viết.
- Duyệt/từ chối request.
- Duyệt/từ chối bài tuyển dụng.
- Admin đổi role thủ công.

#### Phase 4: Tích hợp Phân tích CV

- CTA “Phân tích CV với bài này”.
- Prefill JD từ bài tuyển dụng vào form phân tích CV.
- Banner source Explore trong trang phân tích.

---

## Verification Plan

### Automated Commands

```powershell
npm run lint
npm run build
```

Migration:

```powershell
npm run db:generate
```

Sau khi review migration:

```powershell
npm run db:migrate
```

### Manual Verification

#### User thường

1. Vào `/app/explore` thấy feed.
2. Đăng CV lên Khám phá.
3. Comment vào bài public.
4. Gửi yêu cầu trở thành Nhà tuyển dụng.
5. Không thấy form đăng bài tuyển dụng.
6. Bấm bài tuyển dụng → **Phân tích CV với bài này** → form `/app` được prefill JD.

#### Admin

1. Vào **Quản lý nhà tuyển dụng**.
2. Duyệt request của user.
3. Kiểm tra user được đổi role thành `recruiter`.
4. Vào **Quản lý bài viết**.
5. Duyệt bài tuyển dụng pending.
6. Từ chối bài và lưu lý do.
7. Ẩn bài/comment vi phạm.
8. Đổi role thủ công trong quản lý user.

#### Recruiter

1. Sau khi được duyệt, vào Khám phá thấy form đăng tin tuyển dụng.
2. Đăng bài tuyển dụng.
3. Bài ở trạng thái `pending`, chưa hiện public.
4. Sau khi admin duyệt, bài hiện trong feed.
5. Nếu bị từ chối, recruiter thấy lý do và có thể sửa/gửi lại nếu triển khai action update.

#### Security checks

1. User thường gọi action đăng tuyển dụng bị chặn.
2. Recruiter không thể tự publish bài.
3. Recruiter không thể duyệt request/bài viết.
4. User không thể comment vào bài chưa public.
5. User không thể dùng `postId` của bài `pending/rejected` để prefill phân tích CV.
