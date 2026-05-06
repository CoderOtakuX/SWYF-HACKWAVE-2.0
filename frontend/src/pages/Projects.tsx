import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SkinToneAnalysis from "@/components/SkinToneAnalysis";
import { Package, Sparkles } from "lucide-react";
import ThreeDGenerator from "@/components/ThreeDGenerator";

const Projects = () => {
  const [activeTab, setActiveTab] = useState("skin-tone");

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="glass-morphism rounded-xl p-8 shadow-lg">
            <Tabs
              defaultValue="skin-tone"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1 rounded-xl bg-muted/50 backdrop-blur-sm">
                <TabsTrigger
                  value="skin-tone"
                  className="py-3 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md transition-all duration-200 dark:text-foreground dark:data-[state=active]:text-white"
                >
                  <Sparkles className="mr-2 h-5 w-5 text-brand-pink" />
                  <span>Skin Tone Analysis</span>
                </TabsTrigger>
                <TabsTrigger
                  value="3d-generator"
                  className="py-3 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md transition-all duration-200 dark:text-foreground dark:data-[state=active]:text-white"
                >
                  <Package className="mr-2 h-5 w-5 text-blue-500" />
                  <span>3D Generator</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="skin-tone" className="space-y-6">
                <SkinToneAnalysis />
              </TabsContent>

              <TabsContent value="3d-generator" className="space-y-6">
                <ThreeDGenerator />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Projects;
