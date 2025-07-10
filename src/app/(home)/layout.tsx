export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex max-h-screen min-h-screen flex-col">
      <div className="bg-background absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#393e4a22_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#dadde2_1px,transparent_1px)]"></div>
      <div className="flex flex-1 flex-col px-4 pb-4">{children}</div>
    </main>
  );
}
