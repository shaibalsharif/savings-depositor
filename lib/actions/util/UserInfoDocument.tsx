// // lib/components/UserInfoDocument.tsx

// import React from 'react';
// import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
// import path from 'path';
// import fs from 'fs';

// // Helper function to safely format date values
// const formatDateValue = (date: any): string => {
//     if (date instanceof Date) {
//         return date.toISOString().split('T')[0];
//     }
//     return '----------';
// };

// // Helper function to handle null/empty values for display
// const formatDisplayValue = (value: any): string => {
//     return value ? String(value) : '----------';
// };

// const registerFontIfAvailable = (fontName: string, fontPath: string) => {
//     if (fs.existsSync(fontPath)) {
//         Font.register({ family: fontName, src: fontPath });
//     } else {
//         console.error(`Font file not found at: ${fontPath}`);
//     }
// };

// const HELVETICA_FONT_PATH = path.join(process.cwd(), 'lib', 'fonts', 'Helvetica.ttf');
// const HELVETICA_BOLD_FONT_PATH = path.join(process.cwd(), 'lib', 'fonts', 'Helvetica-Bold.ttf');
// const BANGLA_FONT_PATH = path.join(process.cwd(), 'lib', 'fonts', 'Kalpurush.ttf');

// registerFontIfAvailable('Helvetica', HELVETICA_FONT_PATH);
// registerFontIfAvailable('Helvetica-Bold', HELVETICA_BOLD_FONT_PATH);
// registerFontIfAvailable('Kalpurush', BANGLA_FONT_PATH);

// const LOGO_IMAGE_PATH = 'https://static.vecteezy.com/system/resources/previews/047/656/219/non_2x/abstract-logo-design-for-any-corporate-brand-business-company-vector.jpg';
// const profile_image = "https://t4.ftcdn.net/jpg/02/90/27/39/360_F_290273933_ukYZjDv8nqgpOBcBUo5CQyFcxAzYlZRW.jpg";
// const nominee_image = "https://media.istockphoto.com/id/615279718/photo/businesswoman-portrait-on-white.jpg?s=612x612&w=0&k=20&c=Aa2Vy4faAPe9fAE68Z01jej9YqPqy-RbAteIlF3wcjk=";

// const styles = StyleSheet.create({
//     page: {
//         padding: 12,
//         margin: 12,
//         fontFamily: 'Kalpurush',
//         border: '1.5pt solid black',
//         position: 'relative',
//     },
//     pageBackground: {
//         position: 'absolute',
//         left: 0,
//         right: 0,
//         top: 0,
//         bottom: 0,
//         opacity: 0.1,
//         height: '100%',
//         width: '100%',
//     },
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         marginBottom: 20,
//         marginTop: 20,
//         position: 'relative',
//     },
//     headerImage: {
//         width: 80,
//         height: 80,
//     },
//     headerTitle: {
//         fontSize: 20,
//         fontFamily: 'Kalpurush',
//         textAlign: 'center',
//         flex: 1,
//         marginLeft: 10,
//         marginRight: 10,
//     },
//     profileImage: {
//         width: 80,
//         height: 80,
//         border: '1pt solid black',
//         padding: 2,
//         backgroundColor: '#fff',
//     },
//     fieldRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginBottom: 8,
//     },
//     fieldHalf: {
//         width: '48%',
//     },
//     fieldFull: {
//         width: '100%',
//     },
//     fieldLabel: {
//         fontSize: 12,
//         fontFamily: 'Kalpurush',
//     },
//     fieldValue: {
//         borderBottom: '1pt dotted black',
//         paddingLeft: 5,
//         marginTop: 2,
//     },
//     fieldValueText: {
//         fontSize: 12,
//         fontFamily: 'Kalpurush',
//     },
//     section: {
//         marginBottom: 15,
//     },
//     sectionTitle: {
//         fontSize: 14,
//         textDecoration: 'none',
//         marginBottom: 5,
//         fontFamily: 'Kalpurush',
//     },
//     termsText: {
//         fontSize: 10,
//         fontFamily: 'Kalpurush',
//         lineHeight: 1.5,
//     },
//     checkboxContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 5,
//         width: '50%',
//     },
//     checkbox: {
//         width: 12,
//         height: 12,
//         border: '1pt solid black',
//         marginRight: 5,
//     },
//     signatureContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 30,
//     },
//     signatureBlock: {
//         width: '45%',
//         borderTop: '1pt solid black',
//         paddingTop: 5,
//         textAlign: 'center',
//     },
//     signatureText: {
//         fontSize: 10,
//         fontFamily: 'Kalpurush',
//     },
//     committeeSignatures: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 50,
//     },
// });

// interface UserInfoDocumentProps {
//     user: any;
//     info: any;
//     nominee: any;
//     termsContent: string;
// }

// const UserInfoDocument = ({ user, info, nominee, termsContent }: UserInfoDocumentProps) => {
//     console.log({ ...user, ...info, ...nominee, termsContent });

//     return (
//         <Document>
//             <Page style={styles.page}>
//                 <Image style={styles.pageBackground} src={LOGO_IMAGE_PATH} fixed />

//                 {/* Header Section */}
//                 <View style={styles.header}>
//                     <Image style={styles.headerImage} src={LOGO_IMAGE_PATH} />
//                     <Text style={styles.headerTitle}>Project 13 সদস্য ফর্ম</Text>
//                     <Image style={styles.profileImage} src={profile_image} />
//                 </View>

//                 {/* 1. ব্যক্তিগত তথ্য Section */}
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>🧾 <span className='ml-4'></span>ব্যক্তিগত তথ্য</Text>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১.নাম (বাংলায়):</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.nameBn)}</Text>
//                             </View>
//                         </View>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>২. নাম (ইংরেজিতে):</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(user?.name)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>৩.পিতার নাম / স্বামীর নাম:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.father)}</Text>
//                             </View>
//                         </View>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>৪.মাতার নাম:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.mother)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>৫. জন্ম তারিখ:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDateValue(info?.dob)}</Text>
//                             </View>
//                         </View>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>৬. জাতীয় পরিচয়পত্র / জন্ম সনদ নম্বর:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.nidNumber)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>৭. পেশা:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.profession)}</Text>
//                             </View>
//                         </View>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>৮. ধর্ম:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.religion)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldFull}>
//                             <Text style={styles.fieldLabel}>৯. স্থায়ী ঠিকানা:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.permanentAddress)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldFull}>
//                             <Text style={styles.fieldLabel}>১০. বর্তমান ঠিকানা:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.presentAddress)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১১. মোবাইল নম্বর:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(info?.mobile)}</Text>
//                             </View>
//                         </View>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১২. ইমেইল:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(user?.email)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                 </View>

//                 {/* 2. নমিনি (উত্তরাধিকারী) তথ্য Section */}
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>👤 নমিনি (উত্তরাধিকারী) তথ্য</Text>
//                     <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
//                         <Text style={{ fontFamily: 'Kalpurush', fontSize: 12 }}>নমিনির ছবি: </Text>
//                         <Image style={{ ...styles.profileImage, width: 60, height: 60 }} src={nominee_image} />
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১৩. নমিনির নাম:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(nominee?.name)}</Text>
//                             </View>
//                         </View>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১৪. সম্পর্ক:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(nominee?.relation)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১৫. জন্ম তারিখ:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDateValue(nominee?.dob)}</Text>
//                             </View>
//                         </View>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১৬. মোবাইল নম্বর:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(nominee?.mobile)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১৭. জাতীয় পরিচয়পত্র নম্বর:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(nominee?.nidNumber)}</Text>
//                             </View>
//                         </View>
//                         <View style={styles.fieldHalf}>
//                             <Text style={styles.fieldLabel}>১৮. ঠিকানা:</Text>
//                             <View style={styles.fieldValue}>
//                                 <Text style={styles.fieldValueText}>{formatDisplayValue(nominee?.address)}</Text>
//                             </View>
//                         </View>
//                     </View>
//                 </View>

//                 {/* 3. কমিটির তথ্য Section */}
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>📌 কমিটির তথ্য</Text>
//                     <Text style={styles.fieldLabel}>১৯. আপনি কোন পদে আবেদন করছেন?:</Text>
//                     <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
//                         {['সভাপতি', 'সাধারণ সম্পাদক', 'সাংগঠনিক সম্পাদক', 'অর্থ সম্পাদক', 'সদস্য'].map((position, index) => (
//                             <View key={index} style={styles.checkboxContainer}>
//                                 <View style={styles.checkbox}></View>
//                                 <Text style={styles.fieldLabel}>{position}</Text>
//                             </View>
//                         ))}
//                     </View>
//                 </View>

//                 {/* 4. সদস্যদের জন্য মাসিক জমা ও প্রকল্পের নিয়মাবলী Section */}
//                 <View style={styles.section} break>
//                     <Text style={styles.sectionTitle}>📜 সদস্যদের জন্য মাসিক জমা ও প্রকল্পের নিয়মাবলী</Text>
//                     <Text style={styles.termsText}>{formatDisplayValue(termsContent)}</Text>
//                 </View>

//                 {/* 5. ঘোষণাপত্র Section */}
//                 <View style={styles.section}>
//                     <Text style={styles.sectionTitle}>✅ ঘোষণাপত্র</Text>
//                     <Text style={styles.termsText}>
//                         আমি এই মর্মে ঘোষণা করছি যে, উপরের প্রদত্ত সকল তথ্য সত্য এবং সঠিক। সংগঠনের সকল নিয়মনীতি মেনে চলার অঙ্গীকার করছি।
//                     </Text>
//                     <View style={styles.signatureContainer}>
//                         <View style={styles.signatureBlock}>
//                             <Text style={styles.signatureText}>আবেদনকারীর স্বাক্ষর</Text>
//                         </View>
//                         <View style={styles.signatureBlock}>
//                             <Text style={styles.signatureText}>তারিখ</Text>
//                         </View>
//                     </View>
//                 </View>

//                 {/* 6. কমিটির ব্যবহারের জন্য Section */}
//                 <View style={{ ...styles.section, marginTop: 30 }}>
//                     <Text style={styles.sectionTitle}>☑️ কমিটির ব্যবহারের জন্য</Text>
//                     <View style={styles.fieldRow}>
//                         <View style={styles.checkboxContainer}>
//                             <View style={styles.checkbox}></View>
//                             <Text style={styles.fieldLabel}>গৃহীত</Text>
//                         </View>
//                         <View style={styles.checkboxContainer}>
//                             <View style={styles.checkbox}></View>
//                             <Text style={styles.fieldLabel}>গৃহীত নয়</Text>
//                         </View>
//                     </View>

//                     <View style={styles.committeeSignatures}>
//                         <View style={styles.signatureBlock}>
//                             <Text style={styles.signatureText}>সভাপতির স্বাক্ষর</Text>
//                         </View>
//                         <View style={styles.signatureBlock}>
//                             <Text style={styles.signatureText}>সাধারণ সম্পাদকের স্বাক্ষর</Text>
//                         </View>
//                     </View>
//                 </View>
//             </Page>
//         </Document>
//     );
// };

// export default UserInfoDocument;